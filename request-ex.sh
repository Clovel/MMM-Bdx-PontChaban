#!/bin/bash

curl "https://opendata.bordeaux-metropole.fr/api/records/1.0/search/?dataset=previsions_pont_chaban&q=date_passage>2020/05/13&lang=fr&rows=5&sort=-date_passage&facet=bateau&timezone=Europe%2FParis"