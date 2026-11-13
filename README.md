# הלב של ליה ❤️

לב תלת־ממדי אינטראקטיבי לילדים. אפשר לסובב אותו, להפוך אותו לשקוף, להיכנס לחדרים, לראות את המסתמים נפתחים ונסגרים, לצפות בפעימה בהילוך איטי עם א.ק.ג., לרכוב על תא הדם "טיפי" ולהגדיל עד בועיות הריאה.

**האתר:** https://xsprite85-bit.github.io/lia-heart/

## התקנה כאפליקציה
פותחים את האתר בכרום בטלפון → תפריט ⋮ → "הוספה למסך הבית" / "התקנת אפליקציה". האייקון הוא הלוגו מתיקיית `icons/`.

## מבנה
- `index.html`: האתר כולו בקובץ אחד, כולל המודל והקול המוקלט (three.js נטען מ־CDN).
- `src/`: קוד המקור.
  - `template.html`: הדף עצמו.
  - `assemble.py`: מרכיב את `lia-heart.html` מהתבנית, מהמודל (`heart_mo.glb`), מהנתונים (`heartdata.json`) ומהמודולים `fist.js` ו־`alveoli.js`.
  - `build.py`: בונה את המודל ואת מסלולי הדם מ־BodyParts3D.
- `voice/`: ההקלטות. `heart_voice.py` מקליט את הקריינות ב־Gemini TTS (קול Kore), באותה שיטה כמו במשחק האותיות (letters-bay). `clips/` הם הקליפים המוכנים, קובץ mp3 ו־json לכל משפט.

## בנייה מחדש
```bash
cd src && python3 assemble.py https://cdn.jsdelivr.net/npm/three@0.170.0 ../lia-heart.html
cd ../voice && GK=<gemini key> python3 heart_voice.py ../lia-heart.html   # מקליט רק משפטים חדשים או כאלה שהשתנו
cp ../lia-heart-gemini.html ../index.html
```
את המפתח מעבירים רק כמשתנה סביבה. לא שומרים אותו בקבצים.

## קרדיט
המודל האנטומי: BodyParts3D, © The Database Center for Life Science, ברישיון CC BY-SA 2.1 Japan.
