"""
Collar Bomba · El caso del repartidor de pizza (Erie, 2003)
Web interactiva en Flask + Jinja2.

Ejecutar:
    pip install -r requirements.txt
    python app.py
y abrir http://127.0.0.1:5000
"""
import threading

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# ---------------------------------------------------------------------------
# Datos del caso (todo informativo, basado en fuentes públicas: FBI, CBS, etc.)
# Las horas marcadas con aprox=True son estimaciones de la narrativa pública.
# "min" = minutos desde las 13:30 (para el reloj interactivo).
# ---------------------------------------------------------------------------
EVENTOS = [
    {
        "min": 0,
        "hora": "13:30",
        "aprox": True,
        "titulo": "Empieza el turno",
        "texto": "Brian Wells, de 46 años, repartidor de Mama Mia's Pizza-Ria en Erie, "
                 "Pensilvania, comienza su jornada como cualquier otro día.",
        "icono": "🍕",
    },
    {
        "min": 55,
        "hora": "14:25",
        "aprox": True,
        "titulo": "Un pedido extraño",
        "texto": "Entra una llamada para una entrega en una zona apartada, cerca de una "
                 "torre de televisión. Es la última entrega de su vida.",
        "icono": "📞",
    },
    {
        "min": 78,
        "hora": "14:48",
        "aprox": True,
        "titulo": "El banco",
        "texto": "Entra a una sucursal del PNC Bank en Peach Street con un artefacto "
                 "metálico bloqueado al cuello y un arma disfrazada de bastón. "
                 "Sale con 8.702 dólares.",
        "icono": "🏦",
    },
    {
        "min": 87,
        "hora": "14:57",
        "aprox": True,
        "titulo": "Detenido",
        "texto": "La policía estatal lo detiene en un estacionamiento cercano y lo esposa. "
                 "Wells asegura que lo obligaron y repite que el aparato va a estallar.",
        "icono": "🚓",
    },
    {
        "min": 108,
        "hora": "15:18",
        "aprox": False,
        "titulo": "15:18",
        "texto": "Mientras la policía espera al escuadrón antibombas, y con cámaras de "
                 "televisión presentes, el artefacto detona. Brian Wells muere en el lugar.",
        "icono": "💥",
    },
]

PERSONAJES = [
    {
        "id": "wells", "nombre": "Brian Wells", "rol": "Repartidor de pizza · fallecido",
        "icono": "🍕", "x": 50, "y": 48, "estado": "debatido",
        "texto": "Tenía 46 años. Dijo a la policía que unos hombres lo obligaron a asaltar el "
                 "banco. En 2007 la acusación federal lo nombró como participante del plan; "
                 "su familia siempre sostuvo su inocencia. Su verdadero grado de participación "
                 "sigue siendo el gran debate del caso.",
        "conexiones": [
            {"con": "pnc", "etiqueta": "asaltó"},
            {"con": "torre", "etiqueta": "última entrega"},
            {"con": "diehl", "etiqueta": "¿cómplice o víctima?", "disputado": True},
        ],
    },
    {
        "id": "diehl", "nombre": "Marjorie Diehl-Armstrong", "rol": "Condenada · murió en prisión",
        "icono": "M", "x": 22, "y": 20, "estado": "culpable",
        "texto": "Según la fiscalía, necesitaba dinero para pagar el asesinato de su padre y "
                 "cobrar una herencia. Fue condenada en 2010 por robo a mano armada, "
                 "conspiración y uso de un artefacto destructivo. Ya cumplía condena por "
                 "matar a su novio.",
        "conexiones": [
            {"con": "rothstein", "etiqueta": "ex prometido"},
            {"con": "barnes", "etiqueta": "socio del plan"},
            {"con": "roden", "etiqueta": "lo asesinó"},
            {"con": "stockton", "etiqueta": "testificó en su contra"},
        ],
    },
    {
        "id": "rothstein", "nombre": "William Rothstein", "rol": "Colaborador · murió de cáncer",
        "icono": "R", "x": 18, "y": 72, "estado": "culpable",
        "texto": "Manitas y exprofesor sustituto de ciencias. Según los fiscales fue quien "
                 "fabricó el aparato. Murió de cáncer antes de que el caso llegara a juicio.",
        "conexiones": [
            {"con": "barnes", "etiqueta": "reuniones del plan"},
            {"con": "roden", "etiqueta": "ayudó a ocultar el cuerpo"},
        ],
    },
    {
        "id": "barnes", "nombre": "Kenneth Barnes", "rol": "Se declaró culpable",
        "icono": "K", "x": 52, "y": 10, "estado": "culpable",
        "texto": "Amigo de pesca de Diehl-Armstrong. Se declaró culpable, testificó en su "
                 "contra y recibió 45 años de prisión.",
        "conexiones": [
            {"con": "wells", "etiqueta": "estuvo en la reunión previa"},
        ],
    },
    {
        "id": "roden", "nombre": "James Roden", "rol": "Novio de Diehl-Armstrong · asesinado",
        "icono": "J", "x": 84, "y": 16, "estado": "victima",
        "texto": "Su cuerpo apareció en un congelador, en una casa cercana a la torre de TV, "
                 "durante la investigación. Diehl-Armstrong se declaró culpable pero con "
                 "enfermedad mental. Los fiscales creen que lo mataron para que no revelara el plan.",
        "conexiones": [
            {"con": "torre", "etiqueta": "hallado cerca"},
        ],
    },
    {
        "id": "stockton", "nombre": "Floyd Stockton", "rol": "Testigo con inmunidad",
        "icono": "F", "x": 7, "y": 45, "estado": "testigo",
        "texto": "Recibió inmunidad a cambio de testificar contra Diehl-Armstrong.",
        "conexiones": [],
    },
    {
        "id": "pnc", "nombre": "PNC Bank · Peach Street", "rol": "Escena del asalto",
        "icono": "🏦", "x": 78, "y": 84, "estado": "lugar",
        "texto": "Sucursal en las afueras de Erie. Wells salió con 8.702 dólares en una bolsa "
                 "y fue detenido minutos después.",
        "conexiones": [],
    },
    {
        "id": "torre", "nombre": "La torre de TV", "rol": "Punto de la última entrega",
        "icono": "📡", "x": 86, "y": 52, "estado": "lugar",
        "texto": "Zona donde Wells hizo su último reparto. Cerca de allí, los investigadores "
                 "encontraron después el cuerpo de James Roden.",
        "conexiones": [],
    },
]

QUIZ = [
    {
        "pregunta": "¿En qué ciudad ocurrió el caso del collar bomba?",
        "opciones": ["Pittsburgh", "Erie, Pensilvania", "Boston", "Cali"],
        "correcta": 1,
        "explicacion": "Ocurrió el 28 de agosto de 2003 en Erie, Pensilvania (EE. UU.).",
    },
    {
        "pregunta": "¿A qué se dedicaba Brian Wells?",
        "opciones": ["Cartero", "Guardia de seguridad", "Repartidor de pizza", "Mecánico"],
        "correcta": 2,
        "explicacion": "Era repartidor en Mama Mia's Pizza-Ria. Por eso el caso se conoce como 'Pizza Bomber'.",
    },
    {
        "pregunta": "¿Cuánto dinero salió del banco?",
        "opciones": ["$8.702", "$87.020", "$870", "$250.000"],
        "correcta": 0,
        "explicacion": "Salió con 8.702 dólares: una cifra pequeña para un plan tan elaborado.",
    },
    {
        "pregunta": "¿Qué hacía la policía cuando ocurrió la explosión?",
        "opciones": [
            "Perseguía a Wells por la carretera",
            "Interrogándolo en la comisaría",
            "Esperando al escuadrón antibombas",
            "Evacuando el banco",
        ],
        "correcta": 2,
        "explicacion": "Wells estaba esposado en un estacionamiento y la policía esperaba al escuadrón antibombas.",
    },
    {
        "pregunta": "¿A qué hora ocurrió la explosión?",
        "opciones": ["12:00", "15:18", "17:45", "20:30"],
        "correcta": 1,
        "explicacion": "A las 15:18, unos minutos después de la detención.",
    },
    {
        "pregunta": "¿Quién fue condenada en 2010 por su papel en el plan?",
        "opciones": [
            "Marjorie Diehl-Armstrong",
            "Elvia Cortés",
            "Jessica Fletcher",
            "Kenneth Barnes",
        ],
        "correcta": 0,
        "explicacion": "Marjorie Diehl-Armstrong fue condenada por robo a mano armada, conspiración y uso de un artefacto destructivo. Barnes se declaró culpable antes.",
    },
    {
        "pregunta": "¿Qué sigue siendo materia de debate en el caso?",
        "opciones": [
            "La fecha exacta del asalto",
            "Si Wells fue víctima o participante del plan",
            "La ciudad donde ocurrió",
            "El nombre del banco",
        ],
        "correcta": 1,
        "explicacion": "Los fiscales lo consideraron participante (quizá engañado sobre el aparato); su familia sostiene su inocencia.",
    },
]

# Votos del debate (en memoria; se reinician al reiniciar el servidor)
VOTOS = {"victima": 0, "enganado": 0, "incierto": 0}
_lock = threading.Lock()


# ---------------------------------------------------------------------------
# Rutas
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html", eventos=EVENTOS, total_min=EVENTOS[-1]["min"])


@app.route("/api/personajes")
def api_personajes():
    return jsonify(PERSONAJES)


@app.route("/api/quiz")
def api_quiz():
    # No se envía la respuesta correcta al cliente
    publico = [
        {"id": i, "pregunta": q["pregunta"], "opciones": q["opciones"]}
        for i, q in enumerate(QUIZ)
    ]
    return jsonify(publico)


@app.route("/api/quiz/<int:qid>", methods=["POST"])
def api_quiz_check(qid):
    if qid < 0 or qid >= len(QUIZ):
        return jsonify({"error": "Pregunta no encontrada"}), 404
    data = request.get_json(silent=True) or {}
    respuesta = data.get("respuesta", -1)
    q = QUIZ[qid]
    return jsonify(
        {
            "acierto": respuesta == q["correcta"],
            "correcta": q["correcta"],
            "explicacion": q["explicacion"],
        }
    )


@app.route("/api/voto", methods=["GET", "POST"])
def api_voto():
    with _lock:
        if request.method == "POST":
            data = request.get_json(silent=True) or {}
            opcion = data.get("opcion")
            if opcion not in VOTOS:
                return jsonify({"error": "Opción inválida"}), 400
            VOTOS[opcion] += 1
        return jsonify(dict(VOTOS))


if __name__ == "__main__":
    app.run(debug=True)
