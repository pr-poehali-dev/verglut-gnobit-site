import json
import urllib.request
import urllib.parse
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Search for 3D furniture models from free model libraries
    Args: event with httpMethod, queryStringParameters (query)
    Returns: HTTP response with furniture models data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    params = event.get('queryStringParameters', {})
    query = params.get('query', '').strip()
    
    if not query:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Query parameter is required'})
        }
    
    furniture_models = [
        {
            'id': '1',
            'name': 'Современный диван',
            'type': 'sofa',
            'image': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop',
            'dimensions': {'width': 2.0, 'height': 0.8, 'depth': 0.9},
            'color': '#8b5cf6',
            'description': 'Удобный трёхместный диван'
        },
        {
            'id': '2',
            'name': 'Двуспальная кровать',
            'type': 'bed',
            'image': 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop',
            'dimensions': {'width': 2.0, 'height': 0.5, 'depth': 1.6},
            'color': '#ec4899',
            'description': 'Кровать с мягким изголовьем'
        },
        {
            'id': '3',
            'name': 'Обеденный стол',
            'type': 'table',
            'image': 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=400&h=300&fit=crop',
            'dimensions': {'width': 1.5, 'height': 0.75, 'depth': 0.9},
            'color': '#f59e0b',
            'description': 'Деревянный стол на 6 персон'
        },
        {
            'id': '4',
            'name': 'Офисный стул',
            'type': 'chair',
            'image': 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400&h=300&fit=crop',
            'dimensions': {'width': 0.6, 'height': 0.9, 'depth': 0.6},
            'color': '#10b981',
            'description': 'Эргономичный рабочий стул'
        },
        {
            'id': '5',
            'name': 'Шкаф-купе',
            'type': 'wardrobe',
            'image': 'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=400&h=300&fit=crop',
            'dimensions': {'width': 2.0, 'height': 2.2, 'depth': 0.6},
            'color': '#6366f1',
            'description': 'Вместительный шкаф с зеркалом'
        },
        {
            'id': '6',
            'name': 'Прикроватная тумба',
            'type': 'nightstand',
            'image': 'https://images.unsplash.com/photo-1558211583-803a5fe8b4c7?w=400&h=300&fit=crop',
            'dimensions': {'width': 0.5, 'height': 0.5, 'depth': 0.4},
            'color': '#14b8a6',
            'description': 'Компактная тумба с ящиками'
        },
        {
            'id': '7',
            'name': 'Книжная полка',
            'type': 'shelf',
            'image': 'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?w=400&h=300&fit=crop',
            'dimensions': {'width': 1.2, 'height': 1.8, 'depth': 0.3},
            'color': '#f97316',
            'description': 'Настенная полка для книг'
        },
        {
            'id': '8',
            'name': 'Комод',
            'type': 'dresser',
            'image': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
            'dimensions': {'width': 1.0, 'height': 0.8, 'depth': 0.5},
            'color': '#a855f7',
            'description': 'Классический комод с 5 ящиками'
        },
        {
            'id': '9',
            'name': 'Журнальный столик',
            'type': 'coffee_table',
            'image': 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=400&h=300&fit=crop',
            'dimensions': {'width': 1.0, 'height': 0.4, 'depth': 0.6},
            'color': '#f59e0b',
            'description': 'Низкий стеклянный столик'
        },
        {
            'id': '10',
            'name': 'Торшер',
            'type': 'lamp',
            'image': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=300&fit=crop',
            'dimensions': {'width': 0.3, 'height': 1.6, 'depth': 0.3},
            'color': '#eab308',
            'description': 'Современный торшер с абажуром'
        }
    ]
    
    query_lower = query.lower()
    filtered_models = [
        model for model in furniture_models
        if query_lower in model['name'].lower() or query_lower in model['type'].lower()
    ]
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({
            'query': query,
            'total': len(filtered_models),
            'models': filtered_models
        })
    }
