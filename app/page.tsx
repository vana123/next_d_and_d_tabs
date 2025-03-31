import DraggableTabs from '../components/DraggableTabs';

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <DraggableTabs />
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Welcome</h1>
        <p>Select a tab to view its content.</p>
      </div>
    </div>
  );
}