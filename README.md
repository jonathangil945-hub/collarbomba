# Collar Bomba · Expediente interactivo (Flask)

Aplicación web educativa sobre el caso del collar bomba ocurrido en Erie, Pensilvania, en 2003. Permite explorar una cronología, consultar evidencias y participar en actividades interactivas.

## Requisitos

- Python 3.10 o superior.
- pip.
- Git, si vas a publicar el proyecto en GitHub.
- Una cuenta de Render para desplegarlo en la web.

## Ejecutar localmente

1. Clona el repositorio o descarga el proyecto.
2. Abre una terminal en la carpeta principal del proyecto.
3. Instala las dependencias:

   ```bash
   pip install -r requirements.txt
   ```

4. Inicia la aplicación:

   ```bash
   python app.py
   ```

5. Abre en tu navegador:

   http://127.0.0.1:5000

## Despliegue en Render

Crea un servicio web (Web Service) conectado a tu repositorio de GitHub y utiliza esta configuración:

- **Runtime:** Python 3.
- **Build Command:**

  ```bash
  pip install -r requirements.txt
  ```

- **Start Command:**

  ```bash
  gunicorn app:app
  ```

### Dependencias

El archivo `requirements.txt` debe incluir, como mínimo, las siguientes dependencias si la aplicación utiliza Flask y Gunicorn:

```text
Flask
gunicorn
```

Si el proyecto utiliza otras librerías, mantenlas también en el archivo.

**Importante:** el comando `gunicorn app:app` supone que el archivo principal se llama `app.py` y que la instancia de Flask se llama `app`.

## Características

- **Reloj del caso:** control mediante slider y reproducción automática, con efectos visuales en el momento de las 15:18.
- **Tablero de evidencias:** conexiones SVG con hilos rojos; los enlaces punteados representan relaciones disputadas.
- **Expediente interactivo:** información censurada que se revela mediante interacción.
- **Debate interactivo:** posiciones de víctima y participante, con votos almacenados en la memoria del servidor.
- **Cuestionario:** siete preguntas con temporizador y validación de respuestas en Flask.
- **Modo linterna:** efecto de iluminación que sigue el cursor.

## Estructura del proyecto

```text
collar-bomba/
├── app.py
├── requirements.txt
├── templates/
│   ├── base.html
│   └── index.html
└── static/
    ├── css/
    │   └── style.css
    └── js/
        └── main.js
```

## Tecnologías utilizadas

- Python
- Flask
- Jinja2
- HTML5
- CSS3
- JavaScript
- SVG
- Gunicorn para el despliegue en producción

## Consideraciones

- Los votos almacenados en la memoria del servidor pueden perderse cuando la aplicación se reinicia o se vuelve a desplegar.
- Para conservar los votos permanentemente, se recomienda utilizar una base de datos.
- La aplicación debe presentar los hechos documentados y distinguirlos de las afirmaciones disputadas.
- No se deben incluir credenciales, contraseñas ni claves privadas en el repositorio.

## Propósito educativo

Este proyecto presenta una experiencia interactiva para estudiar un caso criminal real, examinar evidencias y promover el análisis crítico de los hechos y las distintas interpretaciones.
