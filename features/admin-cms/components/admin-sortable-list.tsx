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

export type SortableListItem = { id: string };

type SortableListContextValue<T extends SortableListItem> = {
  items: T[];
  disabled: boolean;
  renderItem: (item: T, dragHandle: React.ReactNode) => React.ReactNode;
};

const SortableListContext = createContext<SortableListContextValue<SortableListItem> | null>(null);

function useSortableListContext<T extends SortableListItem>() {
  const ctx = useContext(SortableListContext);
  if (!ctx) {
    throw new Error('AdminSortableListItems must be used within AdminSortableListRoot.');
  }
  return ctx as unknown as SortableListContextValue<T>;
}

type AdminSortableListRootProps<T extends SortableListItem> = {
  items: T[];
  onReorder: (orderedIds: string[]) => void;
  disabled?: boolean;
  renderItem: (item: T, dragHandle: React.ReactNode) => React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function AdminSortableListRoot<T extends SortableListItem>({
  items,
  onReorder,
  disabled = false,
  renderItem,
  children,
  className,
}: AdminSortableListRootProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const contextValue = useMemo(
    () => ({ items, disabled, renderItem }) as unknown as SortableListContextValue<SortableListItem>,
    [items, disabled, renderItem],
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
    <SortableListContext.Provider value={contextValue}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className={className}>{children}</div>
      </DndContext>
    </SortableListContext.Provider>
  );
}

function SortableListItemRow<T extends SortableListItem>({
  item,
  disabled,
  renderItem,
}: {
  item: T;
  disabled?: boolean;
  renderItem: (item: T, dragHandle: React.ReactNode) => React.ReactNode;
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
        'inline-flex size-8 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing',
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
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && 'relative z-10 opacity-95 shadow-md')}
    >
      {renderItem(item, handle)}
    </div>
  );
}

export function AdminSortableListItems<T extends SortableListItem>() {
  const { items, disabled, renderItem } = useSortableListContext<T>();

  return (
    <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
      {items.map((item) => (
        <SortableListItemRow key={item.id} item={item} disabled={disabled} renderItem={renderItem} />
      ))}
    </SortableContext>
  );
}
