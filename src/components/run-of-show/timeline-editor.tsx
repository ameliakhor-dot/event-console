"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Plus } from "lucide-react";

import type { RunOfShowItem } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Sortable row ──────────────────────────────────────────────────────────────

interface RowProps {
  item: RunOfShowItem;
  onUpdate: (patch: Partial<RunOfShowItem>) => void;
  onDelete: () => void;
}

function SortableRow({ item, onUpdate, onDelete }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-start gap-3 border-b border-border bg-surface px-4 py-3",
        isDragging && "opacity-50",
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-1 cursor-grab touch-none text-graphite opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        tabIndex={-1}
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-4" />
      </button>

      {/* Time */}
      <input
        type="text"
        value={item.time}
        onChange={(e) => onUpdate({ time: e.target.value })}
        placeholder="7:00pm"
        className="w-20 shrink-0 rounded-none border-0 border-b border-transparent bg-transparent py-0 text-sm font-semibold text-ink placeholder:text-graphite/50 focus:border-border focus:outline-none"
      />

      {/* Label */}
      <input
        type="text"
        value={item.label}
        onChange={(e) => onUpdate({ label: e.target.value })}
        placeholder="Agenda item"
        className="min-w-0 flex-1 rounded-none border-0 border-b border-transparent bg-transparent py-0 text-sm text-ink placeholder:text-graphite/50 focus:border-border focus:outline-none"
      />

      {/* Duration */}
      <div className="flex shrink-0 items-center gap-1">
        <input
          type="number"
          value={item.durationMinutes || ""}
          onChange={(e) => onUpdate({ durationMinutes: Number(e.target.value) || 0 })}
          placeholder="0"
          min={0}
          className="w-12 rounded-none border-0 border-b border-transparent bg-transparent py-0 text-right text-sm text-ink placeholder:text-graphite/50 focus:border-border focus:outline-none"
        />
        <span className="text-xs text-graphite">min</span>
      </div>

      {/* Notes */}
      <input
        type="text"
        value={item.notes ?? ""}
        onChange={(e) => onUpdate({ notes: e.target.value })}
        placeholder="Notes"
        className="w-36 shrink-0 rounded-none border-0 border-b border-transparent bg-transparent py-0 text-sm text-graphite placeholder:text-graphite/30 focus:border-border focus:outline-none"
      />

      {/* Delete */}
      <button
        onClick={onDelete}
        className="mt-0.5 text-graphite opacity-0 transition-opacity group-hover:opacity-100 hover:text-fire"
        aria-label="Delete row"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

// ── Timeline editor ───────────────────────────────────────────────────────────

interface Props {
  items: RunOfShowItem[];
  onChange: (items: RunOfShowItem[]) => void;
}

export function TimelineEditor({ items, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    onChange(arrayMove(items, oldIndex, newIndex));
  }

  function updateItem(id: string, patch: Partial<RunOfShowItem>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function deleteItem(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  function addRow() {
    const newItem: RunOfShowItem = {
      id: crypto.randomUUID(),
      time: "",
      label: "",
      durationMinutes: 0,
      notes: "",
    };
    onChange([...items, newItem]);
  }

  return (
    <div className="border border-border bg-surface">
      {/* Column headers */}
      <div className="flex items-center gap-3 border-b border-border bg-paper px-4 py-2">
        <div className="w-4 shrink-0" />
        <p className="w-20 shrink-0 text-[10px] font-semibold tracking-[0.12em] uppercase text-graphite">
          Time
        </p>
        <p className="min-w-0 flex-1 text-[10px] font-semibold tracking-[0.12em] uppercase text-graphite">
          Agenda item
        </p>
        <p className="w-16 shrink-0 text-right text-[10px] font-semibold tracking-[0.12em] uppercase text-graphite">
          Duration
        </p>
        <p className="w-36 shrink-0 text-[10px] font-semibold tracking-[0.12em] uppercase text-graphite">
          Notes
        </p>
        <div className="w-4 shrink-0" />
      </div>

      {/* Rows */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <SortableRow
              key={item.id}
              item={item}
              onUpdate={(patch) => updateItem(item.id, patch)}
              onDelete={() => deleteItem(item.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {items.length === 0 && (
        <div className="px-4 py-6 text-center text-sm text-graphite">
          No items yet. Add one below or choose a template.
        </div>
      )}

      {/* Add row */}
      <div className="border-t border-border px-4 py-3">
        <Button size="sm" variant="outline" onClick={addRow}>
          <Plus className="size-3.5" />
          Add row
        </Button>
      </div>
    </div>
  );
}
