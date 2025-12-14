@echo off
REM Script para configurar Firewall do Windows para Flask (Porta 5000)
REM Execute como ADMINISTRADOR

echo ========================================
echo CONFIGURANDO FIREWALL PARA FLASK
echo ========================================
echo.

REM Verificar se está sendo executado como administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Executando como Administrador
    echo.
) else (
    echo [ERRO] Este script precisa ser executado como ADMINISTRADOR!
    echo.
    echo Clique com botao direito e selecione "Executar como administrador"
    echo.
    pause
    exit /b 1
)

REM Nome da regra
set RULE_NAME=Flask Testeez - Porta 5000

REM Verificar se regra já existe
netsh advfirewall firewall show rule name="%RULE_NAME%" >nul 2>&1
if %errorLevel% == 0 (
    echo [INFO] Regra "%RULE_NAME%" ja existe
    echo.
    echo Deseja recriar a regra? (S/N)
    set /p RESPOSTA="> "
    if /i "%RESPOSTA%"=="S" (
        echo Removendo regra antiga...
        netsh advfirewall firewall delete rule name="%RULE_NAME%"
        echo [OK] Regra removida
    ) else (
        echo [OK] Mantendo regra existente
        goto FIM
    )
)

REM Adicionar regra de entrada (inbound)
echo Adicionando regra de ENTRADA (Inbound) para porta 5000...
netsh advfirewall firewall add rule name="%RULE_NAME%" dir=in action=allow protocol=TCP localport=5000

if %errorLevel% == 0 (
    echo [OK] Regra de entrada criada com sucesso!
) else (
    echo [ERRO] Falha ao criar regra de entrada
    pause
    exit /b 1
)

echo.
echo Adicionando regra de SAIDA (Outbound) para porta 5000...
netsh advfirewall firewall add rule name="%RULE_NAME% (Out)" dir=out action=allow protocol=TCP localport=5000

if %errorLevel% == 0 (
    echo [OK] Regra de saida criada com sucesso!
) else (
    echo [ERRO] Falha ao criar regra de saida
)

:FIM
echo.
echo ========================================
echo CONFIGURACAO CONCLUIDA!
echo ========================================
echo.
echo Agora voce pode acessar o servidor Flask de outros dispositivos!
echo Execute: python app.py
echo.
echo Para ver os IPs disponiveis, execute:
echo   python setup_network_windows.py
echo.
pause
