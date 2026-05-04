!macro customInstall
  ; Run Bright Data service installer — shows consent dialog if user hasn't seen it
  ExecWait '"$INSTDIR\resources\net_updater32.exe" --install-ui win_brightdata.electron_sample_app' $0
  ; Return codes: 0 = user agreed (service installed)
  ;               1 = user declined / dormant (service not installed; show_consent() can still be called later from the app)
  ;               2 = error (installation problem)
!macroend

!macro customUninstall
  ExecWait '"$INSTDIR\resources\net_updater32.exe" --uninstall win_brightdata.electron_sample_app'
!macroend
