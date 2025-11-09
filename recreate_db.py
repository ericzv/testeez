from app import app, db, Player
import os
from datetime import datetime

# Caminho para o banco de dados
db_path = 'flashcards.db'  # Substitua pelo nome correto do seu arquivo de banco de dados

# Verificar se o banco de dados existe
if os.path.exists(db_path):
    # Fazer backup
    import shutil
    backup_path = db_path + '.backup'
    shutil.copyfile(db_path, backup_path)
    print(f"Backup criado: {backup_path}")
    
    # Remover banco de dados original
    os.remove(db_path)
    print(f"Banco de dados original removido")

# Criar banco de dados novo
with app.app_context():
    # Criar todas as tabelas
    db.create_all()
    print("Banco de dados recriado!")
    
    # Verificar se há um jogador
    player = Player.query.first()
    if not player:
        # Criar jogador com os campos necessários
        player = Player(
            name="Jogador1",              # Nome padrão
            email="jogador@exemplo.com",  # Email padrão
            password="senha123",          # Senha padrão
            character_class="Knight",
            level=1,
            experience=0,
            crystals=0,
            hp=100,                      
            max_hp=100,                  
            mp=50,                       
            max_mp=50,                   
            hp_regen_counter=0,          
            mp_regen_counter=0,          
            damage_bonus=0.0,
            damage_multiplier=1.0,       
            damage_max_recorded=0,       
            current_boss_id=1,
            study_time_total=0,
            last_active=datetime.utcnow(),
            days_streak=0,               
            strength=0,
            vitality=0,
            resistance=0,                
            luck=0,                      
            concentration=0,             
            attribute_points=5,          
            equipped_helmet=None,
            equipped_armor=None,
            equipped_sword=None,
            equipped_soulgem=None,
            equipped_eyes=None
        )
        db.session.add(player)
        db.session.commit()
        print("Jogador criado!")
    else:
        print("Jogador já existe!")