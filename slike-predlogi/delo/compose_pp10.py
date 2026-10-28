# before / after of the helicopter on the heliport (user: "Kje pa je helikopter? Ni ga na helidromu"): before = without it (fn41a / hc22p), after = heli22 (hc22b)
import os
src = open('compose_pp9.py').read(); src = src[:src.find("crop(B('jEnd'), 'pp9-jend-b.png'")]
exec(src)
ns['OUT'] = 'vse37-helikopter'; os.makedirs(ns['OUT'], exist_ok=True)
B = lambda n: ('sh-fn41a-%s.png' if n == 'heliW' else 'sh-hc22p-%s.png') % n
A = lambda n: 'sh-hc22b-%s.png' % n
sheet8('47-1-helikopter-na-helidromu.jpg', '1  Helikopter na helidromu (»Kje pa je helikopter?«)', ['Izbrani helikopter (en velik rotor in rep, rdeč z belim križem) je bil narejen, a skrit – videl se je samo v slikah letenja.', 'Zdaj stoji na znaku H: zadaj spuščena rampa (tam zapelješ noter), spredaj zaprt.'], [
    (B('heliW'), A('heliW'), 0, 'Reševalna baza od zgoraj'), (B('pad'), A('pad'), 0, 'Helidrom od blizu')])
sheet8('47-2-izometricna.jpg', '2  Izometrična kamera (telefon ležeče)', ['Helidrom s kamero, ki ostane v igri.'], [
    (B('pad-iso'), A('pad-iso'), 0, 'Avto ob helidromu')])
cams1('47-3-kamera-za-avtom.jpg', '3  Kamera za avtom (telefon pokonci)', ['Vožnja proti zadnji rampi helikopterja.'], [
    (B('pad-chase'), A('pad-chase'), 'Proti helikopterju')])
