import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [clickCount, setClickCount] = useState(0);
  const [currentInsult, setCurrentInsult] = useState('');
  const { toast } = useToast();

  const insults = [
    'Серьёзно? Снова кликаешь?',
    'У тебя действительно нет дел поважнее?',
    'Это уже становится жалко...',
    'Поздравляю, ты потратил ещё секунду жизни',
    'Твоя продуктивность стремится к нулю',
    'Может пора заняться чем-то полезным?',
    'Ну ты и упёртый...',
    'Сколько можно?!',
    'Даже мне уже скучно',
    'Ты всё ещё здесь? Удивительно.',
  ];

  const mockingPhrases = [
    { icon: 'Coffee', text: 'Иди попей чай' },
    { icon: 'BookOpen', text: 'Почитай книгу' },
    { icon: 'Bike', text: 'Прогуляйся' },
    { icon: 'Users', text: 'Позвони другу' },
    { icon: 'Zap', text: 'Сделай что-то полезное' },
  ];

  const handleUselessClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    const randomInsult = insults[Math.floor(Math.random() * insults.length)];
    setCurrentInsult(randomInsult);

    toast({
      title: "Бесполезный клик",
      description: randomInsult,
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-10 text-6xl font-bold text-primary rotate-12">ЗАЧЕМ?</div>
        <div className="absolute bottom-32 right-16 text-5xl font-bold text-primary -rotate-6">НУ И НУ</div>
        <div className="absolute top-1/3 right-1/4 text-4xl font-bold text-muted-foreground rotate-45">ЭХ...</div>
      </div>

      <div className="max-w-2xl w-full space-y-8 animate-fade-in relative z-10">
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold text-primary">
            Ненужный Сайт
          </h1>
          <p className="text-xl text-muted-foreground">
            Который абсолютно справедливо тебя гнобит
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-card/50 border-2 border-primary/20 animate-scale-in">
          <CardContent className="pt-6 space-y-6">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
                <Icon name="MousePointerClick" size={20} className="text-primary" />
                <span className="text-2xl font-bold">{clickCount}</span>
                <span className="text-muted-foreground">бесполезных кликов</span>
              </div>

              {currentInsult && (
                <p className="text-lg text-primary font-medium animate-shake">
                  {currentInsult}
                </p>
              )}
            </div>

            <Button
              onClick={handleUselessClick}
              size="lg"
              className="w-full text-lg h-14 hover:scale-105 transition-transform"
            >
              <Icon name="HandMetal" size={24} className="mr-2" />
              Нажми меня (если осмелишься)
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {mockingPhrases.map((phrase, index) => (
            <Card
              key={index}
              className="hover:scale-110 transition-transform cursor-pointer backdrop-blur-sm bg-card/30 border border-primary/10 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => {
                toast({
                  title: "Лучше бы...",
                  description: phrase.text,
                });
              }}
            >
              <CardContent className="p-4 text-center space-y-2">
                <Icon name={phrase.icon as any} size={32} className="mx-auto text-primary" />
                <p className="text-xs text-muted-foreground">{phrase.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center space-y-2 opacity-60">
          <p className="text-sm">
            Создано специально для того, чтобы напомнить:
          </p>
          <p className="text-lg font-medium text-primary">
            Твоё время бесценно. А ты тратишь его здесь 🤷
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
