# load_talents.py
import json
import os

def convert_skilltree_to_json():
    # Importar os dados do arquivo skilltree_final.py
    from skilltree_final import talents
    
    # Mapeamento entre ramos e constelações
    branch_to_constellation = {
        "Ofensiva Brutal": "Draco",
        "Defesa e Sobrevivência": "Taurus",
        "Artes Arcanas": "Aquarius",
        "Sorte e Caos": "Hercules",
        "Mente Estratégica": "Pegasus",
        "Constelação Oculta": "Phoenix"
    }
    
    # Formatar os dados para uso no frontend
    formatted_data = {}
    
    for branch, branch_talents in talents.items():
        constellation_id = branch_to_constellation.get(branch)
        if not constellation_id:
            continue
            
        formatted_data[branch] = {
            "id": constellation_id,
            "name": constellation_id,
            "oldName": branch,
            "talents": []
        }
        
        for talent in branch_talents:
            # Formatar os níveis
            levels = []
            
            if branch == "Constelação Oculta":
                # Talentos da constelação oculta têm apenas um nível
                levels = [{
                    "level": 1,
                    "effect": talent.get("effect", ""),
                    "cost": talent.get("cost", 3)
                }]
            else:
                # Talentos normais têm múltiplos níveis
                talent_levels = talent.get("levels", [])
                for level_data in talent_levels:
                    levels.append({
                        "level": level_data.get("level", 1),
                        "effect": level_data.get("effect", ""),
                        "cost": level_data.get("cost", 1)
                    })
            
            formatted_data[branch]["talents"].append({
                "id": talent.get("id", 0),
                "name": talent.get("name", ""),
                "description": "", # Não precisamos de descrição geral
                "levels": levels
            })
    
    # Salvar os dados formatados em um arquivo JavaScript
    js_content = f"const skilltreeData = {json.dumps(formatted_data, indent=2, ensure_ascii=False)};"
    
    # Salvar em arquivo JavaScript
    output_path = "static/js/skilltree_data.js"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"Dados convertidos e salvos em {output_path}")

if __name__ == "__main__":
    convert_skilltree_to_json()