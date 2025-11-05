import json
import urllib.request
import urllib.parse
from typing import Dict, Any, List

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Search for 3D furniture models from Sketchfab public API (no auth required)
    Args: event with httpMethod, queryStringParameters (query)
    Returns: HTTP response with real 3D models from Sketchfab
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
    
    # Search Sketchfab public API
    search_query = f"{query} furniture"
    encoded_query = urllib.parse.quote(search_query)
    
    # Sketchfab public search API - no auth needed for basic search
    api_url = f"https://api.sketchfab.com/v3/search?type=models&q={encoded_query}&downloadable=true&count=20"
    
    try:
        req = urllib.request.Request(api_url)
        req.add_header('User-Agent', 'Mozilla/5.0')
        
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
            
            models: List[Dict[str, Any]] = []
            results = data.get('results', [])
            
            for idx, item in enumerate(results[:15]):
                thumbnails = item.get('thumbnails', {}).get('images', [])
                thumbnail_url = thumbnails[0].get('url') if thumbnails else 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop'
                
                # Extract model info
                name = item.get('name', 'Unnamed Model')
                uid = item.get('uid', f'model_{idx}')
                view_url = f"https://sketchfab.com/models/{uid}"
                
                # Estimate dimensions based on query type
                dimensions = estimate_dimensions(query.lower())
                
                models.append({
                    'id': uid,
                    'name': name,
                    'type': detect_furniture_type(name.lower()),
                    'image': thumbnail_url,
                    'dimensions': dimensions,
                    'color': get_color_for_type(detect_furniture_type(name.lower())),
                    'description': f"3D модель от Sketchfab",
                    'viewUrl': view_url,
                    'source': 'sketchfab'
                })
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({
                    'query': query,
                    'total': len(models),
                    'models': models
                })
            }
            
    except Exception as e:
        # Fallback to default models if API fails
        fallback_models = get_fallback_models(query)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'query': query,
                'total': len(fallback_models),
                'models': fallback_models,
                'fallback': True
            })
        }

def estimate_dimensions(query: str) -> Dict[str, float]:
    """Estimate furniture dimensions based on type"""
    if 'диван' in query or 'sofa' in query:
        return {'width': 2.0, 'height': 0.8, 'depth': 0.9}
    elif 'кровать' in query or 'bed' in query:
        return {'width': 2.0, 'height': 0.5, 'depth': 1.6}
    elif 'стол' in query or 'table' in query:
        return {'width': 1.5, 'height': 0.75, 'depth': 0.9}
    elif 'стул' in query or 'chair' in query:
        return {'width': 0.6, 'height': 0.9, 'depth': 0.6}
    elif 'шкаф' in query or 'wardrobe' in query:
        return {'width': 2.0, 'height': 2.2, 'depth': 0.6}
    elif 'тумба' in query or 'nightstand' in query:
        return {'width': 0.5, 'height': 0.5, 'depth': 0.4}
    elif 'полка' in query or 'shelf' in query:
        return {'width': 1.2, 'height': 1.8, 'depth': 0.3}
    else:
        return {'width': 1.0, 'height': 1.0, 'depth': 0.5}

def detect_furniture_type(name: str) -> str:
    """Detect furniture type from name"""
    if 'sofa' in name or 'диван' in name or 'couch' in name:
        return 'sofa'
    elif 'bed' in name or 'кровать' in name:
        return 'bed'
    elif 'table' in name or 'стол' in name or 'desk' in name:
        return 'table'
    elif 'chair' in name or 'стул' in name or 'seat' in name:
        return 'chair'
    elif 'wardrobe' in name or 'шкаф' in name or 'closet' in name:
        return 'wardrobe'
    elif 'nightstand' in name or 'тумба' in name:
        return 'nightstand'
    elif 'shelf' in name or 'полка' in name or 'bookcase' in name:
        return 'shelf'
    elif 'dresser' in name or 'комод' in name:
        return 'dresser'
    elif 'lamp' in name or 'торшер' in name or 'light' in name:
        return 'lamp'
    else:
        return 'other'

def get_color_for_type(furniture_type: str) -> str:
    """Get color based on furniture type"""
    colors = {
        'sofa': '#8b5cf6',
        'bed': '#ec4899',
        'table': '#f59e0b',
        'chair': '#10b981',
        'wardrobe': '#6366f1',
        'nightstand': '#14b8a6',
        'shelf': '#f97316',
        'dresser': '#a855f7',
        'lamp': '#eab308',
        'other': '#6b7280'
    }
    return colors.get(furniture_type, '#6b7280')

def get_fallback_models(query: str) -> List[Dict[str, Any]]:
    """Fallback models if API fails"""
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
    filtered = [
        model for model in furniture_models
        if query_lower in model['name'].lower() or query_lower in model['type'].lower()
    ]
    
    return filtered if filtered else furniture_models
