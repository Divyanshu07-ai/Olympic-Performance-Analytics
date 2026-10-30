
"""
Olympic Analysis 1896–2026 data builder
----------------------------------------
Builds the static JSON bundle consumed by the dashboard.

Sources bundled under raw_data/:
  - historical: Olympedia-style athlete/event/medal history through 2022
  - paris2024: official Paris 2024 datasets
  - milano_cortina2026: official Milano Cortina 2026 datasets

The dashboard is season-aware. 2026 is represented in the Winter dataset;
2024 is represented in the Summer dataset.
"""
import json, math, os, re, threading, webbrowser
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import pandas as pd

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(SCRIPT_DIR, "raw_data")
OUT = os.path.join(SCRIPT_DIR, "data")
os.makedirs(OUT, exist_ok=True)

H = os.path.join(RAW, "historical")
P = os.path.join(RAW, "paris2024")
M = os.path.join(RAW, "milano_cortina2026")

def clean(v):
    if v is None: return None
    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)): return None
    return v

def age_from_birth(born, year):
    if pd.isna(born) or pd.isna(year): return None
    try:
        d = pd.to_datetime(born, errors="coerce", format="mixed")
        if pd.isna(d): return None
        return int(year) - int(d.year) - (1 if (d.month, d.day) > (7, 1) else 0)
    except Exception:
        return None

def parse_year(edition):
    m = re.search(r"(18|19|20)\d{2}", str(edition))
    return int(m.group()) if m else None

def season_from_edition(edition):
    s = str(edition)
    if "Winter" in s: return "Winter"
    if "Summer" in s or "Intercalated" in s: return "Summer"
    return None

def histogram(values, bin_size=3, lo=10, hi=50):
    vals = [float(v) for v in values if pd.notna(v) and lo <= float(v) <= hi]
    n_bins = int((hi - lo) // bin_size) + 1
    counts = [0] * n_bins
    for v in vals:
        idx = int((v - lo) // bin_size)
        if 0 <= idx < n_bins: counts[idx] += 1
    return {"bin_size": bin_size, "labels": [lo+i*bin_size for i in range(n_bins)], "counts": counts}

# ----------------------------- HISTORICAL -----------------------------
hist_res = pd.read_csv(os.path.join(H, "Olympic_Athlete_Event_Results.csv"))
hist_bio = pd.read_csv(os.path.join(H, "Olympic_Athlete_Bio.csv"))
hist_tally = pd.read_csv(os.path.join(H, "Olympic_Games_Medal_Tally.csv"))
hist_games = pd.read_csv(os.path.join(H, "Olympics_Games.csv"))
hist_countries = pd.read_csv(os.path.join(H, "Olympics_Country.csv"))

hist_res["year"] = hist_res["edition"].map(parse_year)
hist_res["season"] = hist_res["edition"].map(season_from_edition)
hist_res = hist_res[hist_res["season"].notna()].copy()
# 1956 Equestrian is a separate special edition in the source; the main
# 1956 Summer edition already represents the Olympic Games in this dashboard.
hist_tally["season"] = hist_tally["edition"].map(season_from_edition)
hist_tally["year"] = pd.to_numeric(hist_tally["year"], errors="coerce")
hist_tally = hist_tally[hist_tally["season"].notna()].copy()
hist_tally = hist_tally[hist_tally["edition"].astype(str) != "1956 Equestrian"].copy()

# Bio lookup for sex/height/weight/birth date.
bio_cols = ["athlete_id","sex","height","weight","born"]
bio = hist_bio[bio_cols].drop_duplicates("athlete_id")
hist_res = hist_res.merge(bio, on="athlete_id", how="left")
noc_map = hist_countries.drop_duplicates("noc").set_index("noc")["country"].to_dict()
hist_res["country"] = hist_res["country_noc"].map(noc_map).fillna(hist_res["country_noc"])
hist_res["athlete_name"] = hist_res["athlete"].astype(str)

# Historical city lookup.
games = hist_games.copy()
games["season"] = games["edition"].map(season_from_edition)
games["year"] = pd.to_numeric(games["year"], errors="coerce")
games = games[games["season"].notna()].copy()
games = games[games["edition"].astype(str) != "1956 Equestrian"].copy()

# ----------------------------- 2024 SUMMER ------------------------------
p_ath = pd.read_csv(os.path.join(P, "athletes.csv"))
p_med = pd.read_csv(os.path.join(P, "medallists.csv"))
p_events = pd.read_csv(os.path.join(P, "events.csv"))
p_schedules = pd.read_csv(os.path.join(P, "schedules.csv"))
p_total = pd.read_csv(os.path.join(P, "medals_total.csv"))

p_ath["year"], p_ath["season"] = 2024, "Summer"
p_ath["country"] = p_ath["country"].fillna(p_ath["country_long"]).fillna(p_ath["country_code"])
p_ath["age"] = p_ath["birth_date"].map(lambda x: age_from_birth(x, 2024))
p_ath["sport"] = p_ath["disciplines"].fillna("").astype(str).str.extract(r"'([^']+)'")[0].fillna("Unknown")
p_ath["height"] = pd.to_numeric(p_ath["height"], errors="coerce")
p_ath["weight"] = pd.to_numeric(p_ath["weight"], errors="coerce")
p_ath["gender_std"] = p_ath["gender"].map({"Male":"M","Female":"F"}).fillna(p_ath["gender"])

p_med["year"], p_med["season"] = 2024, "Summer"
p_med["medal_std"] = p_med["medal_type"].map({"Gold Medal":"Gold","Silver Medal":"Silver","Bronze Medal":"Bronze"})
p_med["country"] = p_med["country"].fillna(p_med["country_long"]).fillna(p_med["country_code"])
p_med["athlete_name"] = p_med["name"].astype(str)
p_med["sport"] = p_med["discipline"].fillna("Unknown")
p_med["gender_std"] = p_med["gender"].map({"Male":"M","Female":"F"}).fillna(p_med["gender"])

# ----------------------------- 2026 WINTER ------------------------------
m_ath = pd.read_csv(os.path.join(M, "athletes.csv"))
m_med = pd.read_csv(os.path.join(M, "medallists.csv"))
m_total = pd.read_csv(os.path.join(M, "medals.csv"))
m_sched = pd.read_csv(os.path.join(M, "schedules.csv"))

m_ath["year"], m_ath["season"] = 2026, "Winter"
m_ath["country"] = m_ath["country_code"].fillna("Unknown")
m_ath["age"] = pd.NA
m_ath["gender_std"] = m_ath["gender"].fillna("U")
m_ath["height"] = np_nan = pd.NA
m_ath["weight"] = pd.NA
m_ath["sport"] = m_ath["events"].fillna("").astype(str).str.extract(r"'discipline': '([^']+)'")[0].fillna("Unknown")

m_med["year"], m_med["season"] = 2026, "Winter"
m_med["medal_std"] = m_med["medal"].str.title()
m_med["country"] = m_med["country"].fillna(m_med["country_code"])
m_med["athlete_name"] = m_med["name"].astype(str)
m_med["sport"] = m_med["discipline"].fillna("Unknown")
m_med["gender_std"] = m_med["gender"].fillna("U")


# ----------------------------- UNIFIED HELPERS ----------------------------
def medal_rows_for_season(season):
    parts = []
    h = hist_res[(hist_res.season == season) & hist_res.medal.notna()].copy()
    h = h.rename(columns={"medal":"medal_std"})
    h["country"] = h["country"].fillna(h["country_noc"])
    parts.append(h[["year","country","country_noc","athlete_name","sport","event","medal_std","athlete_id"]])
    if season == "Summer":
        p = p_med.copy()
        p["country_noc"] = p["country_code"]
        p["event"] = p["event"]
        p["athlete_id"] = p["code_athlete"]
        parts.append(p[["year","country","country_noc","athlete_name","sport","event","medal_std","athlete_id"]])
    else:
        m = m_med.copy()
        m["country_noc"] = m["country_code"]
        m["event"] = m["event_name"]
        m["athlete_id"] = m["code"]
        parts.append(m[["year","country","country_noc","athlete_name","sport","event","medal_std","athlete_id"]])
    out = pd.concat(parts, ignore_index=True)
    out = out[out["medal_std"].isin(["Gold","Silver","Bronze"])].copy()
    return out

def athlete_participation(season):
    h = hist_res[hist_res.season == season].copy()
    h = h[["year","athlete_id","athlete_name","country","country_noc","sex","height","weight","sport"]].drop_duplicates(["year","athlete_id"])
    h["gender_std"] = h["sex"].map({"Male":"M","Female":"F"}).fillna(h["sex"])
    h = h.merge(bio[["athlete_id","born"]], on="athlete_id", how="left")
    bd = pd.to_datetime(h["born"], errors="coerce", format="mixed")
    before_birthday = (bd.dt.month > 7) | ((bd.dt.month == 7) & (bd.dt.day > 1))
    h["age"] = h["year"].astype("Int64") - bd.dt.year - before_birthday.astype("Int64")
    if season == "Summer":
        recent = p_ath.copy()
        recent["athlete_id"] = recent["code"]
        recent["athlete_name"] = recent["name"]
        recent["country_noc"] = recent["country_code"]
        recent["sport"] = recent["sport"].fillna("Unknown")
    else:
        recent = m_ath.copy()
        recent["athlete_id"] = recent["code"]
        recent["athlete_name"] = recent["name"]
        recent["country_noc"] = recent["country_code"]
    cols = ["year","athlete_id","athlete_name","country","country_noc","gender_std","height","weight","sport","age"]
    h = h[cols].copy()
    recent = recent[cols].copy()

    # Keep matching nullable dtypes on both sides of the concat.  In
    # particular, 2026 has no published height/weight/age values; using
    # Float64 explicitly avoids pandas' all-NA concatenation FutureWarning.
    for frame in (h, recent):
        frame["year"] = pd.to_numeric(frame["year"], errors="coerce").astype("Int64")
        frame["height"] = pd.to_numeric(frame["height"], errors="coerce").astype("Float64")
        frame["weight"] = pd.to_numeric(frame["weight"], errors="coerce").astype("Float64")
        frame["age"] = pd.to_numeric(frame["age"], errors="coerce").astype("Float64")

    return pd.concat([h, recent], ignore_index=True).drop_duplicates(["year","athlete_id"])

def event_participation(season):
    h = hist_res[hist_res.season == season][["year","sport","event"]].drop_duplicates()
    if season == "Summer":
        p = p_events[["sport","event"]].drop_duplicates().assign(year=2024)
        return pd.concat([h, p], ignore_index=True).drop_duplicates(["year","sport","event"])
    # Only medal-bearing 2026 schedule rows represent competition events.
    m = m_sched[m_sched["event_medal"].eq(1)][["discipline","event"]].drop_duplicates()
    m = m.rename(columns={"discipline":"sport"}).assign(year=2026)
    return pd.concat([h, m], ignore_index=True).drop_duplicates(["year","sport","event"])

def country_event_medals(season):
    # One medal per nation/event/discipline, matching Olympic medal-tally logic.
    h = medal_rows_for_season(season)
    h = h.drop_duplicates(["year","country_noc","sport","event","medal_std"])
    return h

def official_tally_rows(season):
    rows=[]
    h=hist_tally[hist_tally.season==season].copy()
    for _,r in h.iterrows():
        for typ,col in [("Gold","gold"),("Silver","silver"),("Bronze","bronze")]:
            n=int(r[col]) if pd.notna(r[col]) else 0
            for _ in range(max(0,n)):
                rows.append((int(r.year),str(r.country),typ))
    if season=="Summer":
        for _,r in p_total.iterrows():
            for typ,col in [("Gold","Gold Medal"),("Silver","Silver Medal"),("Bronze","Bronze Medal")]:
                n=int(r[col]) if pd.notna(r[col]) else 0
                for _ in range(max(0,n)):
                    rows.append((2024,str(r.country),typ))
    else:
        for _,r in m_total.iterrows():
            for typ,col in [("Gold","gold"),("Silver","silver"),("Bronze","bronze")]:
                n=int(r[col]) if pd.notna(r[col]) else 0
                for _ in range(max(0,n)):
                    rows.append((2026,str(r.country),typ))
    return pd.DataFrame(rows, columns=["year","country","medal"])

def build_for_season(season):
    athletes = athlete_participation(season)
    events = event_participation(season)
    medals_ath = medal_rows_for_season(season)
    medals_event = country_event_medals(season)
    tally_rows = official_tally_rows(season)

    years = sorted(set(athletes.year.dropna().astype(int)) | set(events.year.dropna().astype(int)) | set(tally_rows.year.astype(int)))
    # Remove accidental future editions from the historical game metadata.
    years = [y for y in years if y <= (2024 if season=="Summer" else 2026)]

    countries = sorted(set(athletes.country.dropna()) | set(tally_rows.country.dropna()))
    sports = sorted(set(events.sport.dropna()) | set(medals_ath.sport.dropna()))

    # City count from historical games + recent official editions.
    city_rows = games[games.season==season][["year","city"]].drop_duplicates()
    city_list = set(city_rows.loc[city_rows.year <= (2022 if season=="Summer" else 2022),"city"].dropna())
    if season=="Summer": city_list.add("Paris")
    else: city_list.add("Milano Cortina")

    meta = {
        "years": years,
        "countries": countries,
        "sports": sports,
        "stats": {
            "editions": len(years),
            "cities": len(city_list),
            "sports": len(sports),
            "events": int(events[events.year.isin(years)].shape[0]),
            "athletes": int(athletes["athlete_name"].nunique()),
            "nations": int(athletes["country"].nunique()),
        },
        "coverage": {
            "start": min(years) if years else None,
            "end": max(years) if years else None,
            "latestEdition": max(years) if years else None,
            "latestEditionSeason": season,
            "note": "2024 Summer and 2026 Winter records are merged into the historical Olympic series."
        }
    }

    country_index={c:i for i,c in enumerate(countries)}
    official=official_tally_rows(season)
    medals={
        "countries": countries,
        "year": official.year.astype(int).tolist(),
        "country": [country_index.get(c,-1) for c in official.country],
        "medal": official.medal.tolist(),
    }

    # Participation over time
    def counts(col):
        x=athletes.dropna(subset=[col]).drop_duplicates(["year",col]).groupby("year").size().reset_index(name="v").sort_values("year")
        return x
    nat, ath = counts("country"), counts("athlete_id")
    evt = events.groupby("year").size().reset_index(name="v").sort_values("year")
    overtime={
        "years":nat.year.astype(int).tolist(),"nations":nat.v.astype(int).tolist(),
        "events_years":evt.year.astype(int).tolist(),"events":evt.v.astype(int).tolist(),
        "athletes_years":ath.year.astype(int).tolist(),"athletes":ath.v.astype(int).tolist(),
    }

    pt=events.pivot_table(index="sport",columns="year",values="event",aggfunc="count").fillna(0).astype(int)
    heat={"sports":pt.index.tolist(),"years":[int(y) for y in pt.columns],"z":pt.values.tolist()}

    # Most successful athletes: medal records per athlete, with country and sport.
    top={}
    for key,sub in [("Overall",medals_ath)]+[(sp,medals_ath[medals_ath.sport==sp]) for sp in sports]:
        if len(sub)==0: continue
        cnt=sub.groupby("athlete_name").size().sort_values(ascending=False).head(15)
        out=[]
        for name,n in cnt.items():
            r=sub[sub.athlete_name==name].iloc[0]
            out.append({"Name":name,"Medals":int(n),"Sport":str(r.sport),"region":clean(r.country)})
        top[key]=out

    # Country-level data uses event-level medal counts (team medals are not
    # multiplied by the number of team members).
    country_data={}
    for c in countries:
        sub=medals_event[medals_event.country==c]
        if len(sub)==0: continue
        yw=sub.groupby("year").size().reset_index(name="Medal").sort_values("year")
        heatc=sub.pivot_table(index="sport",columns="year",values="event",aggfunc="count").fillna(0).astype(int)
        am=medals_ath[medals_ath.country==c]
        top10=am.groupby("athlete_name").size().sort_values(ascending=False).head(10)
        top10_out=[]
        for name,n in top10.items():
            r=am[am.athlete_name==name].iloc[0]
            top10_out.append({"Name":name,"Medals":int(n),"Sport":str(r.sport)})
        country_data[c]={
            "years":yw.year.astype(int).tolist(),"medals":yw.Medal.astype(int).tolist(),
            "heatmap":{"sports":heatc.index.tolist(),"years":[int(y) for y in heatc.columns],"z":heatc.values.tolist()},
            "top10":top10_out,
        }

    # Age distributions from edition-level athlete records.
    ages=pd.to_numeric(athletes.age,errors="coerce")
    age_distribution={"bin_size":3,"overall_hist":histogram(ages)}
    athletes["_key"] = athletes["year"].astype(str) + "|" + athletes["athlete_id"].astype(str)
    medals_ath["_key"] = medals_ath["year"].astype(str) + "|" + medals_ath["athlete_id"].astype(str)
    for typ,key in [("Silver","silver_hist"),("Bronze","bronze_hist"),("Gold","gold_hist")]:
        keys=medals_ath.loc[medals_ath.medal_std==typ,"_key"].dropna().unique()
        vals=athletes.loc[athletes["_key"].isin(keys),"age"]
        age_distribution[key]=histogram(vals)
    gold_s=medals_ath[medals_ath.medal_std=="Gold"].copy()
    # Attach ages to gold records.
    ages_map=athletes.set_index(["year","athlete_id"])["age"].to_dict()
    gold_s["age"]=[ages_map.get((r.year,r.athlete_id)) for _,r in gold_s.iterrows()]
    gold_s=gold_s.dropna(subset=["age"])
    by=(gold_s.groupby("sport")["age"].agg(["mean","count"]).reset_index())
    by=by[by["count"]>=5].sort_values("mean",ascending=False)
    age_distribution["by_sport_gold_avg"]=[{"sport":str(r.sport),"avg":round(float(r["mean"]),1),"n":int(r["count"])} for _,r in by.iterrows()]

    # Height / weight. 2026 source does not publish these fields, so those
    # athletes naturally remain absent from this visualization.
    hw=athletes.copy()
    hw["height"]=pd.to_numeric(hw["height"],errors="coerce")
    hw["weight"]=pd.to_numeric(hw["weight"],errors="coerce")
    hw=hw.dropna(subset=["height","weight"])
    hw=hw[(hw.height>0)&(hw.weight>0)]
    hw_sports=sorted(hw.sport.dropna().unique().tolist())
    sport_idx={s:i for i,s in enumerate(hw_sports)}
    medal_lookup={}
    for _,r in medals_ath.iterrows():
        medal_lookup[(r.year,r.athlete_id)]=r.medal_std
    height_weight={
        "sports":hw_sports,
        "sport":[sport_idx[s] for s in hw.sport],
        "height":hw.height.astype(float).round(1).tolist(),
        "weight":hw.weight.astype(float).round(1).tolist(),
        "medal":[{"Gold":"G","Silver":"S","Bronze":"B"}.get(medal_lookup.get((y,a)),"N") for y,a in zip(hw.year,hw.athlete_id)],
        "sex":[str(x) for x in hw.gender_std.fillna("U")],
    }

    gender=athletes.assign(g=athletes.gender_std.fillna("U"))
    men=gender[gender.g=="M"].groupby("year").size()
    women=gender[gender.g=="F"].groupby("year").size()
    gy=sorted(set(men.index)|set(women.index))
    gender_over_time={"years":[int(y) for y in gy],"male":[int(men.get(y,0)) for y in gy],"female":[int(women.get(y,0)) for y in gy]}

    # Edition/city metadata is useful for future UI additions and documents
    # exactly what the series contains.
    edition_info=[]
    hist_ed=games[games.season==season][["year","edition","city"]].drop_duplicates()
    for _,r in hist_ed.iterrows():
        y=int(r.year)
        if y <= (2022 if season=="Summer" else 2022):
            edition_info.append({"year":y,"edition":r.edition,"city":r.city})
    if season=="Summer": edition_info.append({"year":2024,"edition":"2024 Summer Olympics","city":"Paris"})
    else: edition_info.append({"year":2026,"edition":"2026 Winter Olympics","city":"Milano Cortina"})
    edition_info=sorted({(x["year"],x["edition"]):x for x in edition_info}.values(),key=lambda x:x["year"])

    return {"meta":meta,"medals":medals,"overtime":overtime,"sportYearHeatmap":heat,
            "mostSuccessful":top,"countryData":country_data,"ageDistribution":age_distribution,
            "heightWeight":height_weight,"genderOverTime":gender_over_time,"editionInfo":edition_info}

bundle={"summer":build_for_season("Summer"),"winter":build_for_season("Winter")}
for key,data in bundle.items():
    outdir=os.path.join(OUT,key); os.makedirs(outdir,exist_ok=True)
    for name,payload in data.items():
        with open(os.path.join(outdir,name+".json"),"w",encoding="utf-8") as f: json.dump(payload,f,separators=(",",":"),ensure_ascii=False)
with open(os.path.join(SCRIPT_DIR,"data.js"),"w",encoding="utf-8") as f:
    f.write("window.OLYMPIC_DATA = "+json.dumps(bundle,separators=(",",":"),ensure_ascii=False)+";")
print("Built Olympic Analysis data bundle.")
for k,d in bundle.items():
    print(k, d["meta"]["stats"], d["meta"]["years"][0], d["meta"]["years"][-1], "medal rows",len(d["medals"]["year"]))

# -------------------------------------------------------------------------
# Local dashboard server
# -------------------------------------------------------------------------
# Running `python build_data.py` now builds the data AND starts the dashboard
# at a browser-friendly localhost URL.  Press Ctrl+C to stop the server.
PORT = int(os.environ.get("OLYMPIC_PORT", "8000"))
os.chdir(SCRIPT_DIR)
url = f"http://127.0.0.1:{PORT}/index.html"

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        print("[server] " + (format % args))

server = ThreadingHTTPServer(("127.0.0.1", PORT), QuietHandler)
print(f"\nOlympic Analysis is running at: {url}")
print("Open the URL above in your browser. Press Ctrl+C to stop the server.")
try:
    webbrowser.open(url)
except Exception:
    pass
try:
    server.serve_forever()
except KeyboardInterrupt:
    print("\nStopping Olympic Analysis server...")
finally:
    server.server_close()
