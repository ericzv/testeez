# 📱 Acesso Remoto ao Servidor Flask

Guia para acessar o servidor Flask do tablet, celular ou outro computador na mesma rede.

## 🚀 Configuração Rápida (Windows)

### Opção 1: Script Automático (RECOMENDADO)

1. **Clique com botão direito** em `setup_firewall.bat`
2. Selecione **"Executar como administrador"**
3. Confirme a configuração do firewall

### Opção 2: Manual

1. Execute como administrador:
   ```batch
   python setup_network_windows.py
   ```

2. Copie o comando de firewall mostrado e execute como administrador

## 📋 Descobrir IP da Rede

Execute:
```bash
python setup_network_windows.py
```

Ou manualmente:
```bash
ipconfig
```

Procure por **"Endereço IPv4"** na conexão Wi-Fi (geralmente algo como `192.168.x.x`)

## 🔧 Configuração Manual do Firewall (Windows)

Se os scripts não funcionarem, adicione a regra manualmente:

1. Abra **PowerShell como Administrador**
2. Execute:
   ```powershell
   netsh advfirewall firewall add rule name="Flask Testeez - Porta 5000" dir=in action=allow protocol=TCP localport=5000
   ```

## 📱 Acessando do Tablet/Celular

1. **Conecte o tablet/celular na MESMA rede Wi-Fi** do computador
2. **Inicie o servidor** no computador:
   ```bash
   python app.py
   ```
3. **No tablet**, abra o navegador e acesse:
   ```
   http://192.168.X.X:5000
   ```
   (substitua `192.168.X.X` pelo IP detectado)

## 🐧 Linux/Mac

O servidor já está configurado. Para ver os IPs:

**Linux:**
```bash
hostname -I
```

**Mac:**
```bash
ifconfig | grep "inet "
```

Acesse usando: `http://<IP>:5000`

## ❓ Problemas Comuns

### Não consigo acessar do tablet

✅ **Checklist:**
- [ ] Tablet e computador na **mesma rede Wi-Fi**?
- [ ] Servidor **rodando** no computador?
- [ ] Firewall **configurado** corretamente?
- [ ] IP está **correto**?

### Erro "Conexão recusada"

- Verifique se o servidor está rodando: `python app.py`
- Confirme o IP com `ipconfig` (Windows) ou `hostname -I` (Linux)

### Firewall bloqueando

- Execute `setup_firewall.bat` como administrador
- Ou adicione exceção manualmente no Windows Defender Firewall

## 🔒 Segurança

⚠️ **ATENÇÃO:**
- Use apenas em redes **confiáveis** (casa, trabalho)
- **NÃO** use em redes públicas (cafeterias, aeroportos)
- Para produção, use HTTPS e autenticação adequada

## 📝 Notas

- Porta padrão: **5000**
- Host configurado: **0.0.0.0** (aceita conexões externas)
- Debug mode: **True** (apenas para desenvolvimento)
