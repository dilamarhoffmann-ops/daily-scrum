# Configurações
$ProjectDir = "c:\Users\SR APOIO\OneDrive\Documents\Projetos IA\Daily Scrum"
$ScriptName = "sync_full.js"
$TaskName = "DailyScrum_GitHub_Sync"
$TaskDescription = "Sincronização bidirecional entre Gestor GN e GitHub (Executa a cada hora)"

# Verificar se o Node está no PATH
$NodePath = (Get-Command node).Source
if (-not $NodePath) {
    Write-Error "Node.js não encontrado no sistema."
    exit
}

# Criar a ação da tarefa
$Action = New-ScheduledTaskAction -Execute $NodePath -Argument "$ProjectDir\$ScriptName" -WorkingDirectory $ProjectDir

# Criar o gatilho (Trigger) para rodar agora e repetir a cada 1 hora indefinidamente
$Trigger = New-ScheduledTaskTrigger -At (Get-Date) -Once -RepetitionInterval (New-TimeSpan -Hours 1)

# Configurações da tarefa (rodar mesmo se não estiver logado se possível, mas aqui usaremos o usuário atual)
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

# Registrar a tarefa
Write-Host "Registrando tarefa agendada: $TaskName..."
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description $TaskDescription -Force

Write-Host "✅ Tarefa agendada com sucesso!"
Write-Host "A sincronização rodará automaticamente a cada 1 hora."
