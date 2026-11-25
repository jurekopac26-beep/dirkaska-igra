# Čiščenje PR do #900 (partyslo, 26. 11.)

## Zaprti (34) z naslednikom
- Že na `main` / prazna razlika: #797, #848, #819, #830.
- Zbrano v #763: #733. Zbrano v #803: #799.
- Zbrano v #1080: #759, #793, #800, #801, #802, #804, #805, #806, #810, #812, #813, #814, #817, #844, #854, #857, #870, #883, #893, #895.
- Zbrano v #1085: #798, #809, #811, #818. Zbrano v #1023: #843.
- Zbrano v #713: #696, #699. Zbrano v #783: #539.

Metoda: `git merge-base --is-ancestor origin/<veja PR> origin/<zbirna veja>` (`git cherry` in tritočkovna razlika nista zanesljiva).

## Ostaja odprto (unikatno delo, brez zbirnega naslednika)
480, 511, 512, 605, 623 (brez skupne zgodovine z main), 668, 671, 673, 675 (brez skupne zgodovine), 685, 708, 713, 714, 743, 754, 758, 770, 783, 785, 787, 789, 791, 803, 816, 823, 826, 832, 840, 841, 842, 850, 862, 898.

Naslednji koraki: 823, 841, 850 (vrsta/docs) preveriti proti `docs/vrsta.md` na `main`; 787 in 789 primerjati; 713 in 714 (S3/S4) primerjati vsebino; ostale zbrati v `zbirna/<tema>` s »Lastnik: partyslo, od 26. 11.«; ob konfliktu z `main` pustiti odprto.
