import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const WeekDay = {
  MONDAY: "MONDAY",
  TUESDAY: "TUESDAY",
  WEDNESDAY: "WEDNESDAY",
  THURSDAY: "THURSDAY",
  FRIDAY: "FRIDAY"
} as const;

const MealSlot = {
  LUNCH: "LUNCH",
  DINNER: "DINNER"
} as const;

const main = async () => {
  await prisma.plannedMeal.deleteMany();
  await prisma.weeklyPlan.deleteMany();
  await prisma.meal.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);
  const user = await prisma.user.create({
    data: {
      email: "test@weeklylunch.local",
      passwordHash
    }
  });

  const chiliRecipe = await prisma.recipe.create({
    data: {
      userId: user.id,
      title: "Chili con carne prise de masse",
      baseServings: 10,
      prepTimeMinutes: 30,
      cookTimeMinutes: 40,
      instructions:
        "Faire revenir les oignons dans l'huile. Ajouter l'ail. Ajouter le bœuf haché et faire cuire. Ajouter les tomates concassées, le concentré de tomate et les épices. Ajouter les haricots rouges. Laisser mijoter 30 à 40 minutes. Cuire le riz à part.",
      ingredients: {
        create: [
          { name: "bœuf haché", quantity: 1.5, unit: "kg" },
          { name: "haricots rouges égouttés", quantity: 800, unit: "g" },
          { name: "tomates concassées", quantity: 800, unit: "g" },
          { name: "oignons", quantity: 3, unit: "pièces" },
          { name: "gousses d'ail", quantity: 3, unit: "pièces" },
          { name: "concentré de tomate", quantity: 2, unit: "cuillères à soupe" },
          { name: "riz cru", quantity: 1, unit: "kg" },
          { name: "huile d'olive", quantity: 2, unit: "cuillères à soupe" },
          { name: "paprika", quantity: 2, unit: "cuillères à café" },
          { name: "cumin", quantity: 2, unit: "cuillères à café" }
        ]
      }
    }
  });

  const curryRecipe = await prisma.recipe.create({
    data: {
      userId: user.id,
      title: "Poulet coco curry",
      baseServings: 10,
      prepTimeMinutes: 25,
      cookTimeMinutes: 25,
      instructions:
        "Faire revenir les oignons dans l'huile. Ajouter le poulet coupé en morceaux. Ajouter l'ail et le curry. Ajouter le lait de coco et laisser mijoter. Cuire le riz à part. Ajouter les légumes surgelés dans la sauce ou les servir à côté.",
      ingredients: {
        create: [
          { name: "filets de poulet", quantity: 2, unit: "kg" },
          { name: "lait de coco", quantity: 800, unit: "ml" },
          { name: "oignons", quantity: 4, unit: "pièces" },
          { name: "riz cru", quantity: 1, unit: "kg" },
          { name: "légumes surgelés", quantity: 1, unit: "kg" },
          { name: "curry", quantity: 2, unit: "cuillères à soupe" },
          { name: "huile d'olive", quantity: 2, unit: "cuillères à soupe" },
          { name: "gousses d'ail", quantity: 2, unit: "pièces" }
        ]
      }
    }
  });

  const chiliMeal = await prisma.meal.create({
    data: {
      userId: user.id,
      title: "Chili con carne prise de masse",
      recipeId: chiliRecipe.id,
      desiredServings: 1
    }
  });

  const curryMeal = await prisma.meal.create({
    data: {
      userId: user.id,
      title: "Poulet coco curry",
      recipeId: curryRecipe.id,
      desiredServings: 1
    }
  });

  const weeklyPlan = await prisma.weeklyPlan.create({
    data: {
      userId: user.id,
      name: "Semaine prise de masse"
    }
  });

  const lunchDays = [
    WeekDay.MONDAY,
    WeekDay.TUESDAY,
    WeekDay.WEDNESDAY,
    WeekDay.THURSDAY,
    WeekDay.FRIDAY
  ];

  await prisma.plannedMeal.createMany({
    data: lunchDays.flatMap((day) => [
      {
        weeklyPlanId: weeklyPlan.id,
        mealId: chiliMeal.id,
        day,
        slot: MealSlot.LUNCH,
        servings: 1
      },
      {
        weeklyPlanId: weeklyPlan.id,
        mealId: curryMeal.id,
        day,
        slot: MealSlot.DINNER,
        servings: 1
      }
    ])
  });

  console.log("Seed done: test@weeklylunch.local / password123");
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
