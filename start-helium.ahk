; Helium App Launcher
; Starts Backend + Frontend or Frontend only
;
; Backend API:  http://localhost:10011
; Frontend Web: http://localhost:10015

#Requires AutoHotkey v2.0
#SingleInstance Force

BackendDir := "F:\GitHub\Helium App\Backend"
FrontendDir := "F:\GitHub\Helium App\Frontend\helium-frontend\web"

choice := MsgBox("Yes = Backend + Frontend (API & Web UI)`nNo = Frontend only (Web UI)", "Helium - What to start?", 3)

if (choice = "Yes") {
    Run(A_ComSpec ' /k "echo Starting Helium backend (dotnet API)... && dotnet run --project Helium.Api"', BackendDir, , &pid)
    Sleep(3000)

    Run(A_ComSpec ' /k "echo Starting Helium frontend (React Vite)... && echo. && echo API:    http://localhost:10011 && echo Web UI: http://localhost:10015 && echo. && npm start"', FrontendDir, , &pid2)

    Sleep(5000)
    MsgBox("API:    http://localhost:10011`nWeb UI: http://localhost:10015", "Helium Started", 64)
    Run("http://localhost:10015")

} else if (choice = "No") {
    Run(A_ComSpec ' /k "echo Starting Helium frontend on http://localhost:10015 ... && echo. && npm start"', FrontendDir, , &pid)
    Sleep(5000)
    MsgBox("Starting on http://localhost:10015", "Helium Frontend", 64)
    Run("http://localhost:10015")
}

ExitApp()
