import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface FurnitureItem {
  id: string;
  name: string;
  type: string;
  position: [number, number, number];
  color: string;
  size: [number, number, number];
}

const FurnitureObject = ({ item, isSelected, onClick }: { 
  item: FurnitureItem; 
  isSelected: boolean;
  onClick: () => void;
}) => {
  return (
    <mesh 
      position={item.position} 
      onClick={onClick}
      scale={isSelected ? 1.05 : 1}
    >
      <boxGeometry args={item.size} />
      <meshStandardMaterial 
        color={isSelected ? '#0EA5E9' : item.color} 
        transparent
        opacity={0.9}
      />
    </mesh>
  );
};

const Room = ({ furniture, selectedId, onSelectFurniture }: { 
  furniture: FurnitureItem[];
  selectedId: string | null;
  onSelectFurniture: (id: string) => void;
}) => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />
      
      <Grid 
        args={[20, 20]} 
        cellSize={1} 
        cellThickness={0.5}
        cellColor="#6b7280"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#0EA5E9"
        fadeDistance={25}
        fadeStrength={1}
        followCamera={false}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#f3f4f6" />
      </mesh>

      {furniture.map((item) => (
        <FurnitureObject 
          key={item.id} 
          item={item} 
          isSelected={selectedId === item.id}
          onClick={() => onSelectFurniture(item.id)}
        />
      ))}
    </>
  );
};

const RoomPlanner = () => {
  const [furniture, setFurniture] = useState<FurnitureItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { toast } = useToast();

  const furnitureLibrary = [
    { name: 'Диван', type: 'sofa', size: [2, 0.8, 0.9] as [number, number, number], color: '#8b5cf6' },
    { name: 'Кровать', type: 'bed', size: [2, 0.5, 1.6] as [number, number, number], color: '#ec4899' },
    { name: 'Стол', type: 'table', size: [1.2, 0.7, 0.8] as [number, number, number], color: '#f59e0b' },
    { name: 'Стул', type: 'chair', size: [0.5, 0.9, 0.5] as [number, number, number], color: '#10b981' },
    { name: 'Шкаф', type: 'wardrobe', size: [1.5, 2, 0.6] as [number, number, number], color: '#6366f1' },
    { name: 'Тумба', type: 'nightstand', size: [0.5, 0.5, 0.5] as [number, number, number], color: '#14b8a6' },
    { name: 'Полка', type: 'shelf', size: [1.5, 0.3, 0.3] as [number, number, number], color: '#f97316' },
    { name: 'Комод', type: 'dresser', size: [1, 0.8, 0.5] as [number, number, number], color: '#a855f7' },
  ];

  const filteredLibrary = furnitureLibrary.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addFurniture = (item: typeof furnitureLibrary[0]) => {
    const newItem: FurnitureItem = {
      id: Date.now().toString(),
      name: item.name,
      type: item.type,
      position: [0, item.size[1] / 2, 0],
      color: item.color,
      size: item.size,
    };
    setFurniture([...furniture, newItem]);
    toast({
      title: "Предмет добавлен",
      description: `${item.name} добавлен в комнату`,
    });
  };

  const removeSelected = () => {
    if (selectedId) {
      setFurniture(furniture.filter(item => item.id !== selectedId));
      setSelectedId(null);
      toast({
        title: "Предмет удалён",
        description: "Предмет удалён из комнаты",
      });
    }
  };

  const clearRoom = () => {
    setFurniture([]);
    setSelectedId(null);
    toast({
      title: "Комната очищена",
      description: "Все предметы удалены",
    });
  };

  const saveLayout = () => {
    localStorage.setItem('roomLayout', JSON.stringify(furniture));
    toast({
      title: "Планировка сохранена",
      description: "Ваша планировка сохранена в браузере",
    });
  };

  const loadLayout = () => {
    const saved = localStorage.getItem('roomLayout');
    if (saved) {
      setFurniture(JSON.parse(saved));
      toast({
        title: "Планировка загружена",
        description: "Ваша планировка восстановлена",
      });
    }
  };

  return (
    <div className="h-screen flex">
      <div className="w-80 bg-card border-r border-border flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Home" size={24} />
            Планировщик Комнат
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="space-y-2">
            <div className="relative">
              <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск мебели..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-2 pr-4">
              {filteredLibrary.map((item, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => addFurniture(item)}
                >
                  <div 
                    className="w-4 h-4 rounded mr-2" 
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}
                </Button>
              ))}
            </div>
          </ScrollArea>

          <div className="space-y-2 pt-4 border-t">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={removeSelected}
              disabled={!selectedId}
            >
              <Icon name="Trash2" size={18} className="mr-2" />
              Удалить выбранное
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={clearRoom}
            >
              <Icon name="RotateCcw" size={18} className="mr-2" />
              Очистить всё
            </Button>
            <Button 
              variant="default" 
              className="w-full"
              onClick={saveLayout}
            >
              <Icon name="Save" size={18} className="mr-2" />
              Сохранить
            </Button>
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={loadLayout}
            >
              <Icon name="Download" size={18} className="mr-2" />
              Загрузить
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <p>💡 Кликните по объекту для выбора</p>
            <p>🖱️ Мышь для поворота камеры</p>
            <p>📦 Всего предметов: {furniture.length}</p>
          </div>
        </CardContent>
      </div>

      <div className="flex-1 relative bg-secondary">
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Загрузка 3D...</p>
            </div>
          </div>
        }>
          <Canvas camera={{ position: [8, 8, 8], fov: 50 }}>
            <Room 
              furniture={furniture} 
              selectedId={selectedId}
              onSelectFurniture={setSelectedId}
            />
            <OrbitControls 
              enableDamping
              dampingFactor={0.05}
              minDistance={5}
              maxDistance={20}
            />
          </Canvas>
        </Suspense>

        <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
          <h2 className="font-semibold text-lg mb-1">3D Планировщик</h2>
          <p className="text-sm text-muted-foreground">
            Выберите мебель из списка слева
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoomPlanner;