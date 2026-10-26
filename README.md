# Vampi TV

![Vampi TV](icon.png)

Canales de TV en vivo dentro de [Kino](https://github.com/kinotvapp/kino-light), desde listas M3U: trae una lista pública lista para usar y acepta las tuyas, con guía de programación opcional.

Live TV channels inside Kino from M3U lists: it comes with a ready-to-use public list and accepts yours, with an optional programme guide.

## Qué trae

- **Una lista incluida**, la pública [Argentina](https://github.com/nicor1029/Argentina) de `nicor1029` (unos 47 canales: animación, cine, religioso, 24/7 y radio). Funciona al instalar, sin configurar nada. Un interruptor la apaga para usar solo las tuyas.
- **Tus propias listas M3U** (hasta 5), cada una con su guía XMLTV opcional.
- **Categorías por grupo**: Kino lee la lista por su cuenta y agrupa los canales por el `group-title` de cada entrada. El grupo «Adultos» siempre queda oculto.
- **Favoritos y recientes que no se mueven**: el código de cada canal sale de su `tvg-id` (o de su dirección y nombre), nunca del número de línea de la lista, así que quitar o agregar canales arriba no cambia los de abajo.
- **Ocultar grupos** por nombre, **User-Agent** de los canales y cada cuánto se actualizan las listas.
- **Comprobar las listas**: dice cuántos canales y grupos tiene cada una, y avisa si una no responde, no parece M3U o repite ids.
- Textos en español e inglés.

## Cómo instalarlo

En Kino: **Ajustes ▸ Plugins ▸ Agregar**, escribe `xuper-plugin/kino-plugin-vampi-tv` y toca **Agregar**. Antes de instalar ves con qué sitio se conecta y qué permisos pide.

## Permisos

- **«Agrega canales en vivo a la pestaña En vivo».**
- **«Puede reproducir canales desde cualquier servidor que indique su lista» (en rojo).** Las listas apuntan a servidores de todo tipo; sin este permiso no se reproduciría ningún canal.
- Se conecta a `raw.githubusercontent.com` (la lista incluida) y a las direcciones que tú escribas.

## Desarrollo

Con el kit de plugins de Kino (carpeta `sdk/`, Node 18 o superior):

```
node sdk/validate.mjs ./kino-plugin-vampi-tv
node sdk/run.mjs ./kino-plugin-vampi-tv live categories
node sdk/run.mjs live playlist <lista.m3u>
```

## Publicar

El repositorio se llama `kino-plugin-vampi-tv` y lleva el topic **`kino-plugin`** (así lo encuentra la búsqueda de plugins de la comunidad).

Aviso: las listas y los canales que traen son de terceros y a veces se retransmiten sin licencia; este plugin solo abre la lista que le indicas, no aloja ni retransmite nada.
