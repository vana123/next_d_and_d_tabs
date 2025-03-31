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
import {
  Pin,
  ChevronDown,
  Star,
  Landmark,
  LayoutDashboard,
  Headset,
  UserRoundPlus,
  Store,
  ChartPie,
  StickyNote,
  Settings,
  BookOpen,
  Box,
  List,
  ShoppingCart,
  MapIcon,
} from 'lucide-react';

interface DraggableTabPaneProps extends React.HTMLAttributes<HTMLDivElement> {
  'data-node-key': string;
  disabled?: boolean;
}

const DraggableTabNode = ({ className, disabled, ...props }: DraggableTabPaneProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: props['data-node-key'],
      disabled: disabled,
    });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: disabled ? 'default' : 'move',
    opacity: isDragging ? 0 : 1,
    position: 'relative',
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(disabled ? {} : listeners)}
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
  icon?: string;
}

// Мапінг іконок для спрощеного рендерингу
const iconMap: { [key: string]: React.ComponentType<{ color?: string; className?: string }> } = {
  star: Star,
  Landmark: Landmark,
  LayoutDashboard: LayoutDashboard,
  Headset: Headset,
  UserRoundPlus: UserRoundPlus,
  Store: Store,
  ChartPie: ChartPie,
  StickyNote: StickyNote,
  Settings: Settings,
  BookOpen: BookOpen,
  Box: Box,
  List: List,
  ShoppingCart: ShoppingCart,
};

export default function DraggableTabsNoAnt() {
  const [items, setItems] = useState<TabItem[]>([
    { key: '1', label: 'Dashboard', url: '/Dashboard', children: 'Content of Tab 1', icon: 'LayoutDashboard' },
    { key: '2', label: 'Banking', url: '/Banking', children: 'Content of Tab 2', icon: 'Landmark' },
    { key: '3', label: 'Telefonie', url: '/Telefonie', children: 'Content of Tab 3', icon: 'Headset' },
    { key: '4', label: 'Accounting', url: '/Accounting', children: 'Content of Tab 4', icon: 'UserRoundPlus' },
    { key: '5', label: 'Verkauf', url: '/Verkauf', children: 'Content of Tab 5', icon: 'Store' },
    { key: '6', label: 'Statistik', url: '/Statistik', children: 'Content of Tab 6', icon: 'ChartPie' },
    { key: '7', label: 'Post Office', url: '/Post_Office', children: 'Content of Tab 7', icon: 'StickyNote', pinned: true },
    { key: '8', label: 'Administration', url: '/Administration', children: 'Content of Tab 8', icon: 'Settings' },
    { key: '9', label: 'Help', url: '/Help', children: 'Content of Tab 9', icon: 'BookOpen' },
    { key: '10', label: 'Warenbestand', url: '/Warenbestand', children: 'Content of Tab 10', icon: 'Box' },
    { key: '11', label: 'Auswahllisten', url: '/Auswahllisten', children: 'Content of Tab 11', icon: 'List' },
    { key: '12', label: 'Einkauf', url: '/Einkauf', children: 'Content of Tab 12', icon: 'ShoppingCart' },
    { key: '13', label: 'Rechn', url: '/Rechn', children: 'Content of Tab 13', icon: 'star' },
  ]);

  const [activeKey, setActiveKey] = useState(items[0].key);
  const [overflowItems, setOverflowItems] = useState<TabItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<TabItem | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const tabsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  useEffect(() => {
    const savedItems = localStorage.getItem('tabOrder');
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tabOrder', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    const currentTab = items.find(item => item.url === pathname);
    if (currentTab) {
      setActiveKey(currentTab.key);
    }
  }, [pathname, items]);

  useEffect(() => {
    if (!tabsRef.current) return;
    const container = tabsRef.current;
    const DROPDOWN_BUTTON_WIDTH = 40;

    const handleResize = () => {
      const containerWidth = container.offsetWidth;
      const tabElements = Array.from(container.querySelectorAll('.tab-item')) as HTMLElement[];

      let totalAllTabsWidth = 0;
      tabElements.forEach(tabEl => {
        totalAllTabsWidth += tabEl.offsetWidth;
      });

      let availableWidth = containerWidth;
      if (totalAllTabsWidth > containerWidth) {
        availableWidth = containerWidth - DROPDOWN_BUTTON_WIDTH;
      }

      let cumulativeWidth = 0;
      const visible: TabItem[] = [];
      const overflow: TabItem[] = [];

      items.forEach((item, index) => {
        const tabEl = tabElements[index];
        if (tabEl) {
          const tabWidth = tabEl.offsetWidth;
          if (cumulativeWidth + tabWidth <= availableWidth) {
            cumulativeWidth += tabWidth;
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

    window.dispatchEvent(new Event('resize'));
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

    window.dispatchEvent(new Event('resize'));
  };

  return (
    <div ref={tabsRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <SortableContext items={items.map(i => i.key)} strategy={horizontalListSortingStrategy}>
          <ul style={{ display: 'flex', listStyle: 'none', margin: 0, padding: 0, flexGrow: 1 }}>
            {items.filter(item => !overflowItems.includes(item)).map(item => {
              const IconComponent = item.icon ? iconMap[item.icon] : null;
              return (
                <DraggableTabNode key={item.key} data-node-key={item.key} disabled={!!item.pinned}>
                  <li
                    className="tab-item"
                    onClick={() => onChange(item.key)}
                    onMouseEnter={() => setHoveredTab(item.key)}
                    onMouseLeave={() => setHoveredTab(null)}
                    style={{
                      padding: '8px 16px',
                      color: activeKey === item.key ? '#343434' : '#7F858D',
                      background: activeKey === item.key ? '#F1F5F8' : '#FEFEFE',
                      cursor: item.pinned ? 'default' : 'pointer',
                      borderTop: activeKey === item.key ? '2px solid #0070f3' : 'none',
                      position: 'relative',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {IconComponent && (
                        <IconComponent
                          color={activeKey === item.key ? '#343434' : '#7F858D'}
                          className="h-4 w-4"
                        />
                      )}
                      {item.label}
                    </span>
                    {/* Popup для кнопки закріплення */}
                    {hoveredTab === item.key && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: '10px',
                          marginTop: 0,
                          padding: '6px 16px',
                          background: '#FEFEFE',
                          border: '1px solid #e2e8f0',
                          borderRadius: '4px',
                          zIndex: 10,
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(item.key);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Pin
                            style={{
                              height: '16px',
                              width: '16px',
                              color: item.pinned ? '#3b82f6' : '#6b7280',
                            }}
                          />
                          <span style={{ fontSize: '14px', color: '#6b7280' }}>
                            {item.pinned ? 'Tab pinnen' : 'Tab anpinnen'}
                          </span>
                        </button>
                      </div>
                    )}
                  </li>
                </DraggableTabNode>
              );
            })}
          </ul>
        </SortableContext>
        <DragOverlay>
          {draggedItem ? (
            <div
              style={{
                background: '#7F858D',
                padding: '8px 16px',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {draggedItem.icon && iconMap[draggedItem.icon] ? React.createElement(iconMap[draggedItem.icon]) : null}
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
              background: '#F1F5F8',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            <ChevronDown color="#7F858D" className="h-5 w-5" />
          </button>
          {dropdownOpen && (
            <ul
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                background: '#FEFEFE',
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {item.icon && iconMap[item.icon] ? React.createElement(iconMap[item.icon]) : null}
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
