"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal } from 'lucide-react';

interface DraggableTabPaneProps extends React.HTMLAttributes<HTMLDivElement> {
  'data-node-key': string;
}

const DraggableTabNode = ({ className, ...props }: DraggableTabPaneProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props['data-node-key'],
  });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'move',
    opacity: isDragging ? 0 : 1,
    position: 'relative',
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      {...props}
      className={`${className ? className : ''} ${isDragging ? 'shadow-lg rounded-md bg-white' : ''}`}
    />
  );
};

interface TabItem {
  key: string;
  label: string;
  url: string;
  children: React.ReactNode;
  pinned?: boolean;
}

export default function DraggableTabsNoAnt() {
  const [items, setItems] = useState<TabItem[]>([
    { key: '1', label: 'Tab 1', url: '/tab1', children: 'Content of Tab 1' },
    { key: '2', label: 'Tab 2', url: '/tab2', children: 'Content of Tab 2' },
    { key: '3', label: 'Tab 3', url: '/tab3', children: 'Content of Tab 3' },
    { key: '4', label: 'Tab 4', url: '/tab4', children: 'Content of Tab 4' },
    { key: '5', label: 'Tab 5', url: '/tab5', children: 'Content of Tab 5' },
  ]);

  const [activeKey, setActiveKey] = useState(items[0].key);
  const [overflowItems, setOverflowItems] = useState<TabItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<TabItem | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const tabsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  useEffect(() => {
    // Завантаження збереженого порядку вкладок з localStorage
    const savedItems = localStorage.getItem('tabOrder');
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
  }, []);

  useEffect(() => {
    // Збереження порядку вкладок при його зміні
    localStorage.setItem('tabOrder', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    // Встановлення активної вкладки згідно з поточним шляхом
    const currentTab = items.find(item => item.url === pathname);
    if (currentTab) {
      setActiveKey(currentTab.key);
    }
  }, [pathname, items]);

  useEffect(() => {
    // Розрахунок переповнення вкладок при зміні розміру вікна
    const handleResize = () => {
      if (!tabsRef.current) return;
      const container = tabsRef.current;
      // Шукаємо всі елементи вкладок за класом 'tab-item'
      const tabElements = container.querySelectorAll('.tab-item');
      const containerWidth = container.offsetWidth;
      let totalWidth = 0;
      const visible: TabItem[] = [];
      const overflow: TabItem[] = [];

      items.forEach((item, index) => {
        const tabEl = tabElements[index] as HTMLElement;
        if (tabEl) {
          const tabWidth = tabEl.offsetWidth;
          // Якщо вкладка закріплена або загальна ширина дозволяє розмістити вкладку
          if (totalWidth + tabWidth <= containerWidth || item.pinned) {
            totalWidth += tabWidth;
            visible.push(item);
          } else {
            overflow.push(item);
          }
        }
      });
      setOverflowItems(overflow);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [items]);

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const dragged = items.find(item => item.key === active.id);
    if (dragged) {
      setDraggedItem(dragged);
    }
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggedItem(null);
    if (active.id !== over?.id) {
      const activeIndex = items.findIndex(item => item.key === active.id);
      const overIndex = items.findIndex(item => item.key === over?.id);
      const newItems = arrayMove(items, activeIndex, overIndex);
      setItems(newItems);
    }
  };

  const onChange = (key: string) => {
    setActiveKey(key);
    const tab = items.find(item => item.key === key);
    if (tab) {
      router.push(tab.url);
    }
  };

  const togglePin = (key: string) => {
    setItems(items.map(item =>
      item.key === key ? { ...item, pinned: !item.pinned } : item
    ));
  };

  return (
    <div ref={tabsRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <SortableContext items={items.map(i => i.key)} strategy={horizontalListSortingStrategy}>
          <ul style={{ display: 'flex', listStyle: 'none', margin: 0, padding: 0, flexGrow: 1 }}>
            {items.filter(item => !overflowItems.includes(item)).map(item => (
              <DraggableTabNode key={item.key} data-node-key={item.key}>
                <li
                  className="tab-item"
                  onClick={() => onChange(item.key)}
                  style={{
                    padding: '8px 16px',
                    border: activeKey === item.key ? '2px solid blue' : '1px solid gray',
                    borderRadius: '4px',
                    marginRight: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    background: activeKey === item.key ? '#e6f7ff' : '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <span>{item.label}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePin(item.key);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      marginLeft: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    {/* <PushPin className={`h-4 w-4 ${item.pinned ? 'text-blue-500' : ''}`} /> */}
                  </button>
                </li>
              </DraggableTabNode>
            ))}
          </ul>
        </SortableContext>
        <DragOverlay>
          {draggedItem ? (
            <div
              style={{
                background: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                borderRadius: '4px',
                padding: '8px 16px',
                border: '1px solid blue',
              }}
            >
              {draggedItem.label}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      {overflowItems.length > 0 && (
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              background: 'none',
              border: '1px solid gray',
              borderRadius: '4px',
              padding: '4px 8px',
              cursor: 'pointer',
            }}
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
          {dropdownOpen && (
            <ul
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                background: '#fff',
                border: '1px solid gray',
                borderRadius: '4px',
                listStyle: 'none',
                padding: '4px 0',
                margin: 0,
                zIndex: 1000,
              }}
            >
              {overflowItems.map(item => (
                <li
                  key={item.key}
                  onClick={() => {
                    onChange(item.key);
                    setDropdownOpen(false);
                  }}
                  style={{
                    padding: '8px 16px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
