#!/usr/bin/env python3
"""
Script para mostrar todos os IPs de rede disponíveis
Use para conectar de outros dispositivos (tablet, celular, etc)
"""

import socket
import subprocess
import platform

def get_local_ips():
    """Retorna todos os IPs locais da máquina"""
    ips = []
    hostname = socket.gethostname()

    try:
        # IP principal
        main_ip = socket.gethostbyname(hostname)
        ips.append(('Principal', main_ip))
    except:
        pass

    # Todos os IPs de todas as interfaces
    try:
        import netifaces
        for interface in netifaces.interfaces():
            addrs = netifaces.ifaddresses(interface)
            if netifaces.AF_INET in addrs:
                for addr in addrs[netifaces.AF_INET]:
                    ip = addr['addr']
                    if ip != '127.0.0.1':
                        ips.append((interface, ip))
    except ImportError:
        # Fallback sem netifaces
        try:
            result = subprocess.run(['hostname', '-I'], capture_output=True, text=True)
            for ip in result.stdout.split():
                if ip != '127.0.0.1':
                    ips.append(('Interface', ip))
        except:
            pass

    return ips

def main():
    print("="*60)
    print("🌐 ENDEREÇOS DE REDE DISPONÍVEIS")
    print("="*60)
    print()

    ips = get_local_ips()

    if ips:
        print("Use qualquer um destes IPs para acessar do tablet/celular:")
        print()

        for interface, ip in ips:
            url = f"http://{ip}:5000"
            print(f"  📱 {interface:15} → {url}")

        print()
        print("="*60)
        print("💡 COMO USAR:")
        print("="*60)
        print("1. Certifique-se que o servidor está rodando (python app.py)")
        print("2. Conecte o tablet/celular na MESMA REDE WiFi")
        print("3. Abra o navegador e acesse um dos URLs acima")
        print("4. Se não funcionar, tente outro IP da lista")
        print()

        # Mostrar também localhost
        print("🖥️  Acesso local (este computador):")
        print(f"     http://localhost:5000")
        print(f"     http://127.0.0.1:5000")
        print()

    else:
        print("❌ Não foi possível detectar IPs de rede")
        print("   Certifique-se que está conectado à internet/rede")
        print()
        print("   Instale netifaces para melhor detecção:")
        print("   pip install netifaces")

    print("="*60)

if __name__ == '__main__':
    main()
