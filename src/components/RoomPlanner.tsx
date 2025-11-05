import { useState, useRef, useEffect } from 'react';
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
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  rotation: number;
}

const RoomPlanner = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [furniture, setFurniture] = useState<FurnitureItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const { toast } = useToast();

  const GRID_SIZE = 20;
  const CELL_SIZE = 30;

  const furnitureLibrary = [
    { name: 'Диван', type: 'sofa', width: 3, height: 2, color: '#8b5cf6' },
    { name: 'Кровать', type: 'bed', width: 3, height: 4, color: '#ec4899' },
    { name: 'Стол', type: 'table', width: 2, height: 2, color: '#f59e0b' },
    { name: 'Стул', type: 'chair', width: 1, height: 1, color: '#10b981' },
    { name: 'Шкаф', type: 'wardrobe', width: 2, height: 1, color: '#6366f1' },
    { name: 'Тумба', type: 'nightstand', width: 1, height: 1, color: '#14b8a6' },
    { name: 'Полка', type: 'shelf', width: 3, height: 1, color: '#f97316' },
    { name: 'Комод', type: 'dresser', width: 2, height: 1, color: '#a855f7' },
  ];

  const filteredLibrary = furnitureLibrary.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addFurniture = (item: typeof furnitureLibrary[0]) => {
    const newItem: FurnitureItem = {
      id: Date.now().toString(),
      name: item.name,
      type: item.type,
      x: GRID_SIZE / 2,
      y: GRID_SIZE / 2,
      width: item.width,
      height: item.height,
      color: item.color,
      rotation: 0,
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

  const rotateSelected = () => {
    if (selectedId) {
      setFurniture(furniture.map(item => 
        item.id === selectedId 
          ? { ...item, rotation: (item.rotation + 90) % 360, width: item.height, height: item.width }
          : item
      ));
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

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const gridX = Math.floor(x / CELL_SIZE);
    const gridY = Math.floor(y / CELL_SIZE);

    const clickedItem = furniture.find(item => 
      gridX >= item.x && gridX < item.x + item.width &&
      gridY >= item.y && gridY < item.y + item.height
    );

    if (clickedItem) {
      setSelectedId(clickedItem.id);
    } else {
      setSelectedId(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedId) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const gridX = Math.floor(x / CELL_SIZE);
    const gridY = Math.floor(y / CELL_SIZE);

    const selectedItem = furniture.find(item => item.id === selectedId);
    if (selectedItem && 
        gridX >= selectedItem.x && gridX < selectedItem.x + selectedItem.width &&
        gridY >= selectedItem.y && gridY < selectedItem.y + selectedItem.height) {
      setIsDragging(true);
      setDragOffset({
        x: gridX - selectedItem.x,
        y: gridY - selectedItem.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !isDragging || !selectedId) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const gridX = Math.floor(x / CELL_SIZE) - dragOffset.x;
    const gridY = Math.floor(y / CELL_SIZE) - dragOffset.y;

    setFurniture(furniture.map(item => 
      item.id === selectedId
        ? { ...item, x: Math.max(0, Math.min(GRID_SIZE - item.width, gridX)), y: Math.max(0, Math.min(GRID_SIZE - item.height, gridY)) }
        : item
    ));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    ctx.strokeStyle = '#0EA5E9';
    ctx.lineWidth = 2;
    for (let i = 0; i <= GRID_SIZE; i += 5) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    furniture.forEach(item => {
      ctx.fillStyle = item.color;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(
        item.x * CELL_SIZE + 2,
        item.y * CELL_SIZE + 2,
        item.width * CELL_SIZE - 4,
        item.height * CELL_SIZE - 4
      );

      if (item.id === selectedId) {
        ctx.strokeStyle = '#0EA5E9';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 1;
        ctx.strokeRect(
          item.x * CELL_SIZE,
          item.y * CELL_SIZE,
          item.width * CELL_SIZE,
          item.height * CELL_SIZE
        );
      }

      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Montserrat';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        item.name,
        item.x * CELL_SIZE + (item.width * CELL_SIZE) / 2,
        item.y * CELL_SIZE + (item.height * CELL_SIZE) / 2
      );
    });
  }, [furniture, selectedId]);

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
                  {item.name} ({item.width}x{item.height})
                </Button>
              ))}
            </div>
          </ScrollArea>

          <div className="space-y-2 pt-4 border-t">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={rotateSelected}
              disabled={!selectedId}
            >
              <Icon name="RotateCw" size={18} className="mr-2" />
              Повернуть (90°)
            </Button>
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
            <p>💡 Кликните по предмету для выбора</p>
            <p>🖱️ Перетаскивайте мышью</p>
            <p>🔄 Поворачивайте выбранный объект</p>
            <p>📦 Всего предметов: {furniture.length}</p>
          </div>
        </CardContent>
      </div>

      <div className="flex-1 relative bg-secondary flex items-center justify-center p-8">
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="border-2 border-border rounded-lg shadow-lg bg-white cursor-pointer"
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
          <h2 className="font-semibold text-lg mb-1">2D Планировщик</h2>
          <p className="text-sm text-muted-foreground">
            Выберите мебель из списка слева
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            1 клетка = 50 см
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoomPlanner;
