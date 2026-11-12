import { Icon } from "@/components/ui/Icon";
import { GROUP_ICON } from "@/domain/shop/pantry";
import styles from "./Shop.module.css";

/** A shopping group's heading with its icon, so the list can be scanned by shape as well as by name. */
export function GroupTitle({ group }: { group: string }) {
  const icon = GROUP_ICON[group as keyof typeof GROUP_ICON] ?? "other";
  return (
    <h2 className={`t-h3 ${styles.groupTitle}`}>
      <span className={styles.groupIcon}>
        <Icon name={icon} size={18} />
      </span>
      {group}
    </h2>
  );
}
