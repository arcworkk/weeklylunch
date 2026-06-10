import { Ingredient } from "../types/ingredient";
import { formatQuantity } from "../utils/formatQuantity";

type ShoppingListProps = {
  items: Ingredient[];
};

export const ShoppingList = ({ items }: ShoppingListProps) => {
  if (items.length === 0) {
    return <p className="muted">Liste de courses vide.</p>;
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Liste de courses</h2>
      </div>
      <ul className="shopping-list">
        {items.map((item, index) => (
          <li key={`${item.name}-${item.unit}-${index}`}>
            <span>{item.name}</span>
            <strong>
              {formatQuantity(item.quantity)} {item.unit}
            </strong>
          </li>
        ))}
      </ul>
    </section>
  );
};
