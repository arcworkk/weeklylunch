import { NextFunction, Request, Response } from "express";
import { prisma } from "../utils/prisma";

const WEEK_DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY"
] as const;

const MEAL_SLOTS = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;

type WeekDay = (typeof WEEK_DAYS)[number];
type MealSlot = (typeof MEAL_SLOTS)[number];

const makeError = (message: string, status: number) => {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
};

const requireUserId = (req: Request) => {
  if (!req.user?.userId) {
    throw makeError("Unauthorized", 401);
  }

  return req.user.userId;
};

const weeklyPlanInclude = {
  plannedMeals: {
    include: {
      meal: {
        include: {
          recipe: {
            include: {
              ingredients: {
                orderBy: { createdAt: "asc" as const }
              }
            }
          }
        }
      }
    },
    orderBy: [{ day: "asc" as const }, { slot: "asc" as const }]
  }
};

const parseWeeklyPlanBody = (body: Record<string, unknown>) => {
  const name = String(body.name ?? "").trim();

  if (!name) {
    throw makeError("Weekly plan name is required", 400);
  }

  return { name };
};

const parsePlannedMealBody = (body: Record<string, unknown>, partial = false) => {
  const mealId = body.mealId === undefined ? undefined : String(body.mealId).trim();
  const day = body.day === undefined ? undefined : String(body.day);
  const slot = body.slot === undefined ? undefined : String(body.slot);
  const servings =
    body.servings === undefined ? undefined : Number(body.servings);

  if (!partial || mealId !== undefined) {
    if (!mealId) {
      throw makeError("mealId is required", 400);
    }
  }

  if (!partial || day !== undefined) {
    if (!day || !WEEK_DAYS.includes(day as WeekDay)) {
      throw makeError("day is invalid", 400);
    }
  }

  if (!partial || slot !== undefined) {
    if (!slot || !MEAL_SLOTS.includes(slot as MealSlot)) {
      throw makeError("slot is invalid", 400);
    }
  }

  if (!partial || servings !== undefined) {
    if (servings === undefined || !Number.isInteger(servings) || servings <= 0) {
      throw makeError("servings must be a positive integer", 400);
    }
  }

  return {
    mealId,
    day: day as WeekDay | undefined,
    slot: slot as MealSlot | undefined,
    servings
  };
};

const ensureMealBelongsToUser = async (mealId: string, userId: string) => {
  const meal = await prisma.meal.findFirst({ where: { id: mealId, userId } });

  if (!meal) {
    throw makeError("Meal not found", 404);
  }

  return meal;
};

const handlePrismaError = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  ) {
    throw makeError("This day and slot already contain a planned meal", 409);
  }

  throw error;
};

export const getWeeklyPlans = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const weeklyPlans = await prisma.weeklyPlan.findMany({
      where: { userId },
      include: weeklyPlanInclude,
      orderBy: { createdAt: "desc" }
    });

    res.json(weeklyPlans);
  } catch (error) {
    next(error);
  }
};

export const getWeeklyPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const weeklyPlan = await prisma.weeklyPlan.findFirst({
      where: { id: req.params.id, userId },
      include: weeklyPlanInclude
    });

    if (!weeklyPlan) {
      throw makeError("Weekly plan not found", 404);
    }

    res.json(weeklyPlan);
  } catch (error) {
    next(error);
  }
};

export const createWeeklyPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const data = parseWeeklyPlanBody(req.body);
    const weeklyPlan = await prisma.weeklyPlan.create({
      data: { ...data, userId },
      include: weeklyPlanInclude
    });

    res.status(201).json(weeklyPlan);
  } catch (error) {
    next(error);
  }
};

export const updateWeeklyPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const data = parseWeeklyPlanBody(req.body);
    const weeklyPlan = await prisma.weeklyPlan.findFirst({
      where: { id: req.params.id, userId }
    });

    if (!weeklyPlan) {
      throw makeError("Weekly plan not found", 404);
    }

    const updatedWeeklyPlan = await prisma.weeklyPlan.update({
      where: { id: weeklyPlan.id },
      data,
      include: weeklyPlanInclude
    });

    res.json(updatedWeeklyPlan);
  } catch (error) {
    next(error);
  }
};

export const deleteWeeklyPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const weeklyPlan = await prisma.weeklyPlan.findFirst({
      where: { id: req.params.id, userId }
    });

    if (!weeklyPlan) {
      throw makeError("Weekly plan not found", 404);
    }

    await prisma.weeklyPlan.delete({ where: { id: weeklyPlan.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const addPlannedMeal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const weeklyPlan = await prisma.weeklyPlan.findFirst({
      where: { id: req.params.id, userId }
    });

    if (!weeklyPlan) {
      throw makeError("Weekly plan not found", 404);
    }

    const data = parsePlannedMealBody(req.body);
    await ensureMealBelongsToUser(data.mealId!, userId);

    const plannedMeal = await prisma.plannedMeal.upsert({
      where: {
        weeklyPlanId_day_slot: {
          weeklyPlanId: weeklyPlan.id,
          day: data.day!,
          slot: data.slot!
        }
      },
      create: {
        weeklyPlanId: weeklyPlan.id,
        mealId: data.mealId!,
        day: data.day!,
        slot: data.slot!,
        servings: data.servings!
      },
      update: {
        mealId: data.mealId!,
        servings: data.servings!
      },
      include: weeklyPlanInclude.plannedMeals.include
    });

    res.status(201).json(plannedMeal);
  } catch (error) {
    next(error);
  }
};

export const updatePlannedMeal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const existingPlannedMeal = await prisma.plannedMeal.findFirst({
      where: { id: req.params.id, weeklyPlan: { userId } }
    });

    if (!existingPlannedMeal) {
      throw makeError("Planned meal not found", 404);
    }

    const data = parsePlannedMealBody(req.body, true);

    if (data.mealId) {
      await ensureMealBelongsToUser(data.mealId, userId);
    }

    try {
      const plannedMeal = await prisma.plannedMeal.update({
        where: { id: existingPlannedMeal.id },
        data: {
          mealId: data.mealId,
          day: data.day,
          slot: data.slot,
          servings: data.servings
        },
        include: weeklyPlanInclude.plannedMeals.include
      });

      res.json(plannedMeal);
    } catch (error) {
      handlePrismaError(error);
    }
  } catch (error) {
    next(error);
  }
};

export const deletePlannedMeal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const plannedMeal = await prisma.plannedMeal.findFirst({
      where: { id: req.params.id, weeklyPlan: { userId } }
    });

    if (!plannedMeal) {
      throw makeError("Planned meal not found", 404);
    }

    await prisma.plannedMeal.delete({ where: { id: plannedMeal.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
