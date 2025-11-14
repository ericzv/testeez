"""
Script para associar as skills do Vlad ao jogador
"""
from database import db
from models import Player, PlayerSkill, AttackSkill, SpecialSkill
from app import app

with app.app_context():
    # Buscar o jogador
    player = Player.query.first()

    if not player:
        print("❌ Nenhum jogador encontrado!")
        exit()

    print(f"✅ Jogador encontrado: {player.name} (ID: {player.id})")

    # IDs das skills de ataque do Vlad
    attack_skill_ids = [50, 51, 52, 53]  # Energia Escura, Garras, Abraço, Beijo

    # IDs das skills especiais do Vlad
    special_skill_ids = [138, 139, 140, 141]  # Autofagia, Lâmina, Barreira, Regeneração

    # Associar skills de ataque
    print("\n🔵 Associando skills de ataque...")
    for skill_id in attack_skill_ids:
        # Verificar se já existe
        existing = PlayerSkill.query.filter_by(
            player_id=player.id,
            skill_id=skill_id,
            skill_type="attack"
        ).first()

        if existing:
            print(f"  ⏭️  Skill de ataque {skill_id} já associada")
        else:
            # Criar associação
            player_skill = PlayerSkill(
                player_id=player.id,
                skill_id=skill_id,
                skill_type="attack",
                current_charges=1,
                unlocked_at=db.func.now()
            )
            db.session.add(player_skill)
            print(f"  ✅ Skill de ataque {skill_id} associada")

    # Associar skills especiais
    print("\n🔴 Associando skills especiais...")
    for skill_id in special_skill_ids:
        # Verificar se já existe
        existing = PlayerSkill.query.filter_by(
            player_id=player.id,
            skill_id=skill_id,
            skill_type="special"
        ).first()

        if existing:
            print(f"  ⏭️  Skill especial {skill_id} já associada")
        else:
            # Criar associação
            player_skill = PlayerSkill(
                player_id=player.id,
                skill_id=skill_id,
                skill_type="special",
                current_charges=1,
                unlocked_at=db.func.now()
            )
            db.session.add(player_skill)
            print(f"  ✅ Skill especial {skill_id} associada")

    # Salvar mudanças
    db.session.commit()
    print("\n✅ Todas as skills foram associadas ao jogador!")

    # Verificar
    attack_count = PlayerSkill.query.filter_by(
        player_id=player.id,
        skill_type="attack"
    ).count()

    special_count = PlayerSkill.query.filter_by(
        player_id=player.id,
        skill_type="special"
    ).count()

    print(f"\n📊 Resumo:")
    print(f"  - Skills de ataque: {attack_count}")
    print(f"  - Skills especiais: {special_count}")
