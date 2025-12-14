#!/usr/bin/env python3
"""
Script para configurar acesso de rede no Windows
Detecta IP e configura firewall automaticamente
"""

import socket
import subprocess
import platform
import sys

def get_windows_ips():
    """Retorna IPs do Windows via ipconfig"""
    try:
        result = subprocess.run(['ipconfig'], capture_output=True, text=True, encoding='cp850')
        output = result.stdout

        ips = []
        current_adapter = None

        for line in output.split('\n'):
            line = line.strip()

            # Detectar adaptador
            if 'Adaptador' in line or 'adapter' in line.lower():
                current_adapter = line

            # Detectar IPv4
            if 'IPv4' in line or 'Endereço IPv4' in line:
                # Extrair IP (formato: "IPv4 Address. . . . . . . . . . . : 192.168.1.100")
                parts = line.split(':')
                if len(parts) >= 2:
                    ip = parts[-1].strip()
                    # Remover (Preferencial) se existir
                    ip = ip.replace('(Preferencial)', '').strip()

                    if ip and ip != '127.0.0.1':
                        adapter_name = current_adapter if current_adapter else 'Desconhecido'
                        ips.append((adapter_name, ip))

        return ips
    except Exception as e:
        print(f"Erro ao executar ipconfig: {e}")
        return []

def configure_firewall():
    """Adiciona regra no firewall do Windows para porta 5000"""
    print("\n🔥 CONFIGURANDO FIREWALL DO WINDOWS")
    print("="*60)

    rule_name = "Flask Testeez - Porta 5000"

    # Verificar se já existe a regra
    check_cmd = f'netsh advfirewall firewall show rule name="{rule_name}"'
    result = subprocess.run(check_cmd, capture_output=True, text=True, shell=True)

    if "No rules match" in result.stdout or "Nenhuma regra" in result.stdout:
        print("Regra não existe, criando...")

        # Criar regra de entrada (inbound)
        add_cmd = (
            f'netsh advfirewall firewall add rule '
            f'name="{rule_name}" '
            f'dir=in action=allow protocol=TCP localport=5000'
        )

        print("\n⚠️  ATENÇÃO: Este comando precisa de privilégios de ADMINISTRADOR")
        print("Execute este comando no PowerShell/CMD como ADMINISTRADOR:")
        print()
        print(f"  {add_cmd}")
        print()
        print("Ou execute este script Python como administrador.")

        try:
            result = subprocess.run(add_cmd, capture_output=True, text=True, shell=True)
            if result.returncode == 0:
                print("✅ Regra de firewall criada com sucesso!")
                return True
            else:
                print(f"❌ Falhou ao criar regra: {result.stderr}")
                print("\n💡 Execute o comando acima manualmente como administrador")
                return False
        except Exception as e:
            print(f"❌ Erro: {e}")
            print("\n💡 Execute o comando acima manualmente como administrador")
            return False
    else:
        print("✅ Regra de firewall já existe!")
        return True

def main():
    print("="*60)
    print("🌐 CONFIGURAÇÃO DE ACESSO REMOTO - WINDOWS")
    print("="*60)
    print()

    # Detectar IPs
    ips = get_windows_ips()

    if not ips:
        print("❌ Não foi possível detectar IPs de rede")
        print("\nTente executar manualmente:")
        print("  ipconfig")
        print("\nE procure por 'Endereço IPv4' nas conexões Wi-Fi ou Ethernet")
        return

    print("📱 ENDEREÇOS DISPONÍVEIS:")
    print()

    wifi_ips = []
    ethernet_ips = []
    other_ips = []

    for adapter, ip in ips:
        if 'wi-fi' in adapter.lower() or 'wireless' in adapter.lower():
            wifi_ips.append((adapter, ip))
        elif 'ethernet' in adapter.lower() or 'local' in adapter.lower():
            ethernet_ips.append((adapter, ip))
        else:
            other_ips.append((adapter, ip))

    # Mostrar Wi-Fi primeiro (mais comum para tablet/celular)
    if wifi_ips:
        print("🔵 Wi-Fi (RECOMENDADO para tablet/celular):")
        for adapter, ip in wifi_ips:
            print(f"   → http://{ip}:5000")
            print(f"      {adapter}")
        print()

    if ethernet_ips:
        print("🔌 Ethernet (conexão cabeada):")
        for adapter, ip in ethernet_ips:
            print(f"   → http://{ip}:5000")
            print(f"      {adapter}")
        print()

    if other_ips:
        print("🔸 Outros adaptadores:")
        for adapter, ip in other_ips:
            print(f"   → http://{ip}:5000")
            print(f"      {adapter}")
        print()

    print("="*60)
    print("📋 INSTRUÇÕES:")
    print("="*60)
    print("1. ✅ Servidor já está configurado (host='0.0.0.0')")
    print("2. 🔥 Configure o Firewall do Windows (veja abaixo)")
    print("3. 📱 Conecte tablet/celular na MESMA REDE Wi-Fi")
    print("4. 🌐 Acesse um dos URLs acima no navegador do tablet")
    print()

    # Configurar firewall
    configure_firewall()

    print()
    print("="*60)
    print("🚀 TESTANDO CONEXÃO:")
    print("="*60)
    print("1. Inicie o servidor: python app.py")
    print("2. No tablet, acesse o URL do Wi-Fi")
    print("3. Se não funcionar, verifique:")
    print("   - Ambos estão na mesma rede Wi-Fi?")
    print("   - Firewall foi configurado corretamente?")
    print("   - Servidor está rodando?")
    print()

if __name__ == '__main__':
    main()
