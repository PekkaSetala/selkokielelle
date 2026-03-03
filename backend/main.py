import os
import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN")

SYSTEM_PROMPT = """Muunna seuraava teksti suomen selkokielelle. Noudata Selkokeskuksen antamia ohjeita:

Vuorovaikutus lukijan kanssa ja tekstin kokonaisuus

Selkotekstit suunnataan erityisesti lukijoille, joilla on eri syistä johtuvia kielellisiä vaikeuksia. He tarvitsevat selkokieltä selvitäkseen arkielämästä, nauttiakseen kirjallisuudesta ja voidakseen osallistua yhteiskunnan toimintaan.

Kun kirjoitat selkotekstiä, pidä koko ajan mielessä, kuka on oletettu lukijasi. Kirjoita lukijan näkökulmasta ja suuntaa sanasi selkeästi hänelle. Rakenna tekstistäsi johdonmukaisesti etenevä ja hyvin jäsennelty kokonaisuus, jossa on tarpeeksi tietoa.

Lukija on tärkein

- Kirjoita lukijan näkökulmasta, älä esimerkiksi organisaation. Mitä lukijan on tärkeää tietää tekstin aiheesta?
- Suuntaa sanasi lukijalle esimerkiksi sinä-muodolla, jos se sopii tekstiin. (Voit hakea apurahaa tällä lomakkeella.)
- Pidä tekstisi tarkoitus kirkkaana mielessäsi. Onko tekstin tarkoitus esimerkiksi viihdyttää, antaa tietoa tai opettaa jokin asia lukijalle?
- Mieti, miten lisäät lukijan mielenkiintoa ja motivaatiota tarttua tekstiin. Kokeile esimerkiksi lukijaa pohtimaan haastavia lauseita, tarinallisuutta, haastatteluita tai tietolaatikoita, jos ne sopivat tekstiin.

Lisää tietoa, karsi tietoa

- Mieti, mikä on tekstisi pääviesti. Keskity siihen.
- Karsi pois kaikki turha tieto, jota lukija ei tarvitse asian ymmärtämisen kannalta. Älä kuitenkaan poista kaikkia tekstiä elävöittäviä yksityiskohtia.
- Varo, ettei tekstiisi synny sisällöllisiä aukkoja. Tekstiin syntyy sisällöllinen aukko, jos kirjoittaja olettaa lukijan päättelevän tai tietävän jotakin, mitä ei sanota tekstissä suoraan.

Pyri kohteliaaseen ja lukijan huomioivaan sävyyn

- Tarkkaile, millainen sävy tekstiin syntyy. Sävy ei saisi olla esimerkiksi aliarvioiva, holhoava tai turhan velvoittava.
- Kirjoita lukijan ikään ja tekstilajiin nähden sopivaa kieltä.
- Älä aliarvioi lukijaa. Älä selitä sanoja, jotka voit olettaa lukijalle tutuiksi. (Lempäälään rakennetaan uusi sairaala. Ei: Lempäälään rakennetaan uusi sairaala eli paikka, jossa hoidetaan potilaita.)

Jäsentele tekstiä sopivan kokoisiin osiin

- Kerro yhdessä kappaleessa vain yksi tärkeä asia ja yhdessä luvussa yksi asiakokonaisuus.
- Otsikoi teksti niin, että otsikko ja sisältö vastaavat toisiaan.
- Rytmitä tekstiä väliotsikoilla. Käytä väliotsikoita myös lyhyemmissä teksteissä.
- Etene tekstissä johdonmukaisesti, älä hypi asiasta toiseen.
- Kertaa aiemmin sanottua etenkin pitemmissä julkaisuissa. Esimerkiksi pitkässä tekstissä kertaalleen selitetyn käsitteen voi selittää uudestaan.

Tärkeää — muoto vastauksessa

- Vastaa pelkällä selkokielisellä tekstillä. Älä lisää johdantoa, selityksiä tai kommentteja ennen tekstiä tai sen jälkeen.
- Älä kirjoita esimerkiksi 'Tässä on selkokielinen versio:' tai muuta preambulia. Aloita suoraan tekstillä."""

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)


class TranslateRequest(BaseModel):
    text: str


@app.post("/api/translate")
async def translate(request: TranslateRequest):
    text = request.text

    if not text or not text.strip():
        return JSONResponse(
            status_code=400,
            content={"error": "Teksti ei voi olla tyhjä"},
        )

    if len(text) > 3000:
        return JSONResponse(
            status_code=400,
            content={"error": "Teksti on liian pitkä"},
        )

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://selkokielelle.fi",
        "X-Title": "selkokielelle.fi",
    }

    payload = {
        "model": "openai/gpt-4o-mini",
        "temperature": 0.3,
        "max_tokens": 2000,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": text},
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
            )
    except httpx.TimeoutException:
        return JSONResponse(
            status_code=504,
            content={"error": "Palvelu ei vastaa juuri nyt, yritä uudelleen"},
        )

    if response.status_code != 200:
        return JSONResponse(
            status_code=502,
            content={"error": "Jokin meni pieleen, yritä uudelleen"},
        )

    try:
        data = response.json()
        result = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, ValueError):
        return JSONResponse(
            status_code=502,
            content={"error": "Jokin meni pieleen, yritä uudelleen"},
        )

    return {"result": result}
