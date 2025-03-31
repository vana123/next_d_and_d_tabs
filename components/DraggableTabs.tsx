"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Tabs, Dropdown, Button } from 'antd';
import type { TabsProps } from 'antd';
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
import { Pin as PushPin, MoreHorizontal } from 'lucide-react';

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
      className={`${className} ${isDragging ? 'shadow-lg rounded-md bg-white' : ''}`}
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

export default function DraggableTabs() {
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
  const tabsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  useEffect(() => {
    // Load saved tab order from localStorage
    const savedItems = localStorage.getItem('tabOrder');
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
  }, []);

  useEffect(() => {
    // Save tab order to localStorage whenever it changes
    localStorage.setItem('tabOrder', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    // Set active key based on current pathname
    const currentTab = items.find(item => item.url === pathname);
    if (currentTab) {
      setActiveKey(currentTab.key);
    }
  }, [pathname, items]);

  useEffect(() => {
    // Handle window resize and calculate overflow
    const handleResize = () => {
      if (!tabsRef.current) return;

      const tabsContainer = tabsRef.current;
      const tabsList = tabsContainer.querySelector('.ant-tabs-nav-list');
      const tabsWidth = tabsContainer.offsetWidth;
      let totalWidth = 0;
      const visibleItems: TabItem[] = [];
      const overflow: TabItem[] = [];

      items.forEach((item, index) => {
        const tab = tabsList?.children[index] as HTMLElement;
        if (tab) {
          const tabWidth = tab.offsetWidth;
          if (totalWidth + tabWidth <= tabsWidth || item.pinned) {
            totalWidth += tabWidth;
            visibleItems.push(item);
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
    const draggedTab = items.find(item => item.key === active.id);
    if (draggedTab) {
      setDraggedItem(draggedTab);
    }
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggedItem(null);
    if (active.id !== over?.id) {
      const activeIndex = items.findIndex((item) => item.key === active.id);
      const overIndex = items.findIndex((item) => item.key === over?.id);
      const newItems = arrayMove(items, activeIndex, overIndex);
      setItems(newItems);
    }
  };

  const onChange = (key: string) => {
    setActiveKey(key);
    const tab = items.find((item) => item.key === key);
    if (tab) {
      router.push(tab.url);
    }
  };

  const togglePin = (key: string) => {
    setItems(items.map(item => 
      item.key === key ? { ...item, pinned: !item.pinned } : item
    ));
  };

  const targetOffset = [0, -4];

  const renderTabBar: TabsProps['renderTabBar'] = (tabBarProps, DefaultTabBar) => (
    <DndContext 
      sensors={sensors} 
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={items.map(i => i.key)} strategy={horizontalListSortingStrategy}>
        <DefaultTabBar {...tabBarProps}>
          {(node) => (
            <DraggableTabNode {...node.props} data-node-key={node.key}>
              <div className="flex items-center gap-2">
                {node.props.children}
                <Button
                  type="text"
                  size="small"
                  icon={<PushPin className={`h-4 w-4 ${items.find(i => i.key === node.key)?.pinned ? 'text-blue-500' : ''}`} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin(node.key as string);
                  }}
                />
              </div>
            </DraggableTabNode>
          )}
        </DefaultTabBar>
      </SortableContext>
      <DragOverlay>
        {draggedItem ? (
          <div className="bg-white shadow-xl rounded-md p-2 border border-blue-500">
            {draggedItem.label}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );

  return (
    <div ref={tabsRef} className="relative">
      <div className="flex items-center">
        <Tabs
          type="card"
          activeKey={activeKey}
          onChange={onChange}
          renderTabBar={renderTabBar}
          items={items.filter(item => !overflowItems.includes(item))}
          className="flex-grow"
        />
        {overflowItems.length > 0 && (
          <Dropdown
            menu={{
              items: overflowItems.map(item => ({
                key: item.key,
                label: item.label,
                onClick: () => onChange(item.key),
              })),
            }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Button
              type="text"
              icon={<MoreHorizontal className="h-5 w-5" />}
              className="ml-2"
            />
          </Dropdown>
        )}
      </div>
    </div>
  );
}