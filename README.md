Następny krok projektu

Skoro realtime + alerty działają, to żeby projekt był “pełny” pod CV, najlepiej teraz:

🔐 AUTORYZACJA + role

login (RHF + Zod)

token w pamięci / localStorage (na MVP)

REST: dostęp tylko po login

WS: połączenie z tokenem (handshake) i dopiero wtedy subscribe

To domyka temat: “czy każdy może zobaczyć każdy home”.

Chcesz iść teraz w login + ochrona REST, czy od razu login + ochrona WebSocket?