'use client';

import { createContext, useContext, useMemo } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortableRowItem = {
  id: string;
};

type SortableTableContextValue<T extends SortableRowItem> = {
  items: T[];
  disabled: boolean;
  renderRow: (item: T, dragHandle: React.ReactNode) => React.ReactNode;
};

const SortableTableContext = createContext<SortableTableContextValue<SortableRowItem> | null>(
  null,
);

function useSortableTableContext<T extends SortableRowItem>() {
  const ctx = useContext(SortableTableContext);
  if (!ctx) {
    throw new Error('AdminSortableTableRows must be used within AdminSortableTableRoot.');
  }
  return ctx as unknown as SortableTableContextValue<T>;
}

type AdminSortableTableRootProps<T extends SortableRowItem> = {
  items: T[];
  onReorder: (orderedIds: string[]) => void;
  disabled?: boolean;
  renderRow: (item: T, dragHandle: React.ReactNode) => React.ReactNode;
  children: React.ReactNode;
};

/** Wraps `<Table>` — DndContext must stay outside `<tbody>`. */
export function AdminSortableTableRoot<T extends SortableRowItem>({
  items,
  onReorder,
  disabled = false,
  renderRow,
  children,
}: AdminSortableTableRootProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const contextValue = useMemo(
    () => ({ items, disabled, renderRow }) as unknown as SortableTableContextValue<SortableRowItem>,
    [items, disabled, renderRow],
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex);
    onReorder(next.map((item) => item.id));
  }

  return (
    <SortableTableContext.Provider value={contextValue}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {children}
      </DndContext>
    </SortableTableContext.Provider>
  );
}

function SortableRow<T extends SortableRowItem>({
  item,
  disabled,
  renderRow,
}: {
  item: T;
  disabled?: boolean;
  renderRow: (item: T, dragHandle: React.ReactNode) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handle = (
    <button
      type="button"
      className={cn(
        'inline-flex size-8 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing',
        disabled && 'pointer-events-none opacity-40',
      )}
      aria-label="Seret untuk mengubah urutan"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" />
    </button>
  );

  return (
    <tr ref={setNodeRef} style={style} className={cn(isDragging && 'relative z-10 bg-muted/50 shadow-sm')}>
      {renderRow(item, handle)}
    </tr>
  );
}

/** Place directly inside `<TableBody>` — renders only `<tr>` rows. */
export function AdminSortableTableRows<T extends SortableRowItem>() {
  const { items, disabled, renderRow } = useSortableTableContext<T>();

  return (
    <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
      {items.map((item) => (
        <SortableRow key={item.id} item={item} disabled={disabled} renderRow={renderRow} />
      ))}
    </SortableContext>
  );
}

/** @deprecated Use AdminSortableTableRoot + AdminSortableTableRows */
export function AdminSortableTable<T extends SortableRowItem>(
  props: Omit<AdminSortableTableRootProps<T>, 'children'>,
) {
  return (
    <AdminSortableTableRoot {...props}>
      <AdminSortableTableRows />
    </AdminSortableTableRoot>
  );
}
