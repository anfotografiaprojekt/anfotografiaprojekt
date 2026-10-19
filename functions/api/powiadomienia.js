// Stary adres (zastąpiony przez /api/formularz). Plik zostaje pusty, aby nadpisał wersję
// pozostałą w repozytorium po wcześniejszych wdrożeniach — można go też po prostu usunąć.
export const onRequest = () => new Response(JSON.stringify({ blad: 'Ten adres nie jest już używany.' }), {
  status: 410, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});
