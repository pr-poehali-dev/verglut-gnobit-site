import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface FurnitureModel {
  id: string;
  name: string;
  type: string;
  image: string;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  color: string;
  description: string;
}

interface FurnitureItem {
  id: string;
  modelId: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  rotation: number;
  image: string;
}

const RoomPlanner = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [furniture, setFurniture] = useState<FurnitureItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FurnitureModel[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isSearching, setIsSearching] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const { toast } = useToast();

  const GRID_SIZE = 20;
  const CELL_SIZE = 30;
  const SCALE = 20;

  useEffect(() => {
    const loadDefaultModels = async () => {
      try {
        const response = await fetch('https://functions.poehali.dev/fa09fac6-d948-415e-ac90-4649f54251ee?query=все');
        const data = await response.json();
        setSearchResults(data.models || []);
      } catch (error) {
        console.error('Error loading models:', error);
      }
    };
    loadDefaultModels();
  }, []);

  const searchFurniture = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Введите запрос",
        description: "Напишите что вы ищете: диван, стол, кровать...",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`https://functions.poehali.dev/fa09fac6-d948-415e-ac90-4649f54251ee?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      setSearchResults(data.models || []);
      toast({
        title: "Поиск завершён",
        description: `Найдено ${data.total} моделей`,
      });
    } catch (error) {
      toast({
        title: "Ошибка поиска",
        description: "Не удалось загрузить модели",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const preloadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  const addFurniture = async (model: FurnitureModel) => {
    const widthInCells = Math.ceil(model.dimensions.width * SCALE);
    const depthInCells = Math.ceil(model.dimensions.depth * SCALE);

    const newItem: FurnitureItem = {
      id: Date.now().toString(),
      modelId: model.id,
      name: model.name,
      type: model.type,
      x: Math.floor(GRID_SIZE / 2 - widthInCells / 2),
      y: Math.floor(GRID_SIZE / 2 - depthInCells / 2),
      width: widthInCells,
      height: depthInCells,
      color: model.color,
      rotation: 0,
      image: model.image,
    };

    if (!loadedImages.has(model.image)) {
      try {
        const img = await preloadImage(model.image);
        setLoadedImages(new Map(loadedImages.set(model.image, img)));
      } catch (error) {
        console.error('Failed to load image:', error);
      }
    }

    setFurniture([...furniture, newItem]);
    toast({
      title: "Предмет добавлен",
      description: `${model.name} добавлен в комнату`,
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
      const x = item.x * CELL_SIZE;
      const y = item.y * CELL_SIZE;
      const w = item.width * CELL_SIZE;
      const h = item.height * CELL_SIZE;

      const img = loadedImages.get(item.image);
      if (img) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.drawImage(img, x + 2, y + 2, w - 4, h - 4);
        ctx.restore();
      } else {
        ctx.fillStyle = item.color;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
      }

      if (item.id === selectedId) {
        ctx.strokeStyle = '#0EA5E9';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 1;
        ctx.strokeRect(x, y, w, h);
      }

      ctx.globalAlpha = 1;
      ctx.fillStyle = '#000000';
      ctx.fillRect(x, y + h - 20, w, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px Montserrat';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.name, x + w / 2, y + h - 10);
    });
  }, [furniture, selectedId, loadedImages]);

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
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Найти мебель..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchFurniture()}
                  className="pl-10"
                />
              </div>
              <Button onClick={searchFurniture} disabled={isSearching}>
                {isSearching ? (
                  <Icon name="Loader2" size={18} className="animate-spin" />
                ) : (
                  <Icon name="Search" size={18} />
                )}
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-3 pr-4">
              {searchResults.map((model) => (
                <Card
                  key={model.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => addFurniture(model)}
                >
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      <img
                        src={model.image}
                        alt={model.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{model.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{model.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {model.dimensions.width}м × {model.dimensions.depth}м
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
            <p>💡 Кликните по модели для добавления</p>
            <p>🖱️ Перетаскивайте мебель мышью</p>
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
          <h2 className="font-semibold text-lg mb-1">3D Планировщик</h2>
          <p className="text-sm text-muted-foreground">
            Реальные модели мебели
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Масштаб 1:{SCALE} • 1 клетка = 5 см
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoomPlanner;
