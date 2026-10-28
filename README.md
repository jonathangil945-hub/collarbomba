# Collar Bomba · Expediente interactivo (Flask)

Web educativa sobre el caso del "collar bomba" de Erie, Pensilvania (2003).

## Ejecutar
    pip install -r requirements.txt
    python app.py
Abrir http://127.0.0.1:5000

## Qué incluye
- Reloj del caso: slider + reproducción automática, con flash y sacudida a las 15:18
- Tablero de evidencias con hilos rojos SVG (los punteados son vínculos disputados)
- Expediente con datos censurados que se desclasifican al tocar
- Debate víctima/participante con votos guardados en el servidor (memoria)
- Quiz de 7 preguntas con temporizador; las respuestas se validan en Flask
- Modo linterna (efecto de foco que sigue al cursor)

## Estructura
    app.py            rutas + datos + API JSON
    templates/        base.html, index.html (Jinja2)
    static/css/       style.css
    static/js/        main.js
