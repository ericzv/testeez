#!/usr/bin/env python3
"""
Script de diagnóstico para conexão remota
"""

import socket
import subprocess
import sys

def check_server_running():
    """Verifica se algo está rodando na porta 5000"""
    print("🔍 1. VERIFICANDO SE SERVIDOR ESTÁ RODANDO...")
    print("-" * 60)

    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('127.0.0.1', 5000))
    sock.close()

    if result == 0:
        print("✅ Servidor está RODANDO na porta 5000")
        return True
    else:
        print("❌ Servidor NÃO está rodando na porta 5000")
        print("   → Execute: python app.py")
        return False

def check_firewall_rules():
    """Verifica regras do firewall"""
    print("\n🔥 2. VERIFICANDO FIREWALL DO WINDOWS...")
    print("-" * 60)

    try:
        result = subprocess.run(
            'netsh advfirewall firewall show rule name="Flask Testeez - Porta 5000"',
            capture_output=True,
            text=True,
            shell=True
        )

        if "No rules match" in result.stdout or "Nenhuma regra" in result.stdout:
            print("❌ Regra de firewall NÃO encontrada")
            print("\n📋 SOLUÇÃO:")
            print("   1. Clique com botão direito em 'setup_firewall.bat'")
            print("   2. Selecione 'Executar como administrador'")
            print("\n   OU execute este comando como admin:")
            print('   netsh advfirewall firewall add rule name="Flask Testeez - Porta 5000" dir=in action=allow protocol=TCP localport=5000')
            return False
        else:
            print("✅ Regra de firewall encontrada:")
            # Mostrar apenas as linhas importantes
            for line in result.stdout.split('\n')[:10]:
                if line.strip():
                    print(f"   {line.strip()}")
            return True
    except Exception as e:
        print(f"⚠️  Erro ao verificar firewall: {e}")
        return False

def get_network_info():
    """Mostra informações de rede"""
    print("\n🌐 3. INFORMAÇÕES DE REDE...")
    print("-" * 60)

    try:
        result = subprocess.run(['ipconfig'], capture_output=True, text=True, encoding='cp850')
        output = result.stdout

        in_wifi = False
        in_ethernet = False

        for line in output.split('\n'):
            line = line.strip()

            if 'Wi-Fi' in line or 'Wireless' in line.lower():
                in_wifi = True
                in_ethernet = False
                print(f"\n📱 {line}")
            elif 'Ethernet' in line:
                in_ethernet = True
                in_wifi = False
                print(f"\n🔌 {line}")
            elif 'IPv4' in line and (in_wifi or in_ethernet):
                print(f"   {line}")
            elif 'Gateway' in line and (in_wifi or in_ethernet):
                print(f"   {line}")

    except Exception as e:
        print(f"Erro: {e}")

def test_port_listening():
    """Testa se a porta está escutando em todas as interfaces"""
    print("\n🔌 4. TESTANDO PORTA 5000...")
    print("-" * 60)

    try:
        result = subprocess.run(
            'netstat -an | findstr :5000',
            capture_output=True,
            text=True,
            shell=True
        )

        if result.stdout:
            print("✅ Porta 5000 está em uso:")
            for line in result.stdout.split('\n'):
                if line.strip():
                    print(f"   {line.strip()}")
                    if '0.0.0.0:5000' in line or '*:5000' in line:
                        print("   ✅ Servidor aceita conexões externas (0.0.0.0)")
                    elif '127.0.0.1:5000' in line:
                        print("   ⚠️  Servidor só aceita localhost! Verifique app.py")
        else:
            print("❌ Porta 5000 não está em uso")
            print("   → Inicie o servidor: python app.py")
    except Exception as e:
        print(f"Erro: {e}")

def main():
    print("="*60)
    print("🔧 DIAGNÓSTICO DE CONEXÃO REMOTA")
    print("="*60)
    print()

    server_ok = check_server_running()
    firewall_ok = check_firewall_rules()
    get_network_info()
    test_port_listening()

    print("\n" + "="*60)
    print("📋 CHECKLIST PARA CONEXÃO DO CELULAR:")
    print("="*60)

    checklist = [
        ("Servidor rodando (python app.py)", server_ok),
        ("Firewall configurado", firewall_ok),
        ("Celular na mesma rede Wi-Fi", None),
        ("IP correto (192.168.x.x)", None),
    ]

    for item, status in checklist:
        if status is True:
            print(f"✅ {item}")
        elif status is False:
            print(f"❌ {item}")
        else:
            print(f"❓ {item} - VERIFICAR MANUALMENTE")

    print("\n" + "="*60)
    print("🔍 PRÓXIMOS PASSOS:")
    print("="*60)

    if not server_ok:
        print("1. ❌ INICIE O SERVIDOR:")
        print("   python app.py")

    if not firewall_ok:
        print("2. ❌ CONFIGURE O FIREWALL:")
        print("   - Clique direito em setup_firewall.bat")
        print("   - Selecione 'Executar como administrador'")

    print("\n3. ✅ NO CELULAR:")
    print("   - Conecte na MESMA rede Wi-Fi do computador")
    print("   - Abra o navegador")
    print("   - Digite: http://192.168.3.5:5000")
    print("   (use o IP Wi-Fi se disponível, não ethernet)")

    print("\n4. 🧪 TESTE LOCAL PRIMEIRO:")
    print("   - No computador, abra: http://localhost:5000")
    print("   - Se funcionar, o problema é rede/firewall")
    print("   - Se não funcionar, o servidor não está rodando")

    print("\n" + "="*60)

if __name__ == '__main__':
    main()
