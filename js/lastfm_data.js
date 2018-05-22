/*
lfm.get('geo.getmetros', {}).done(function(r){


  var nr = spv.toRealArray(spv.getTargetField(r, 'metros.metro'));
  var countries = spv.makeIndexByField(nr, 'country', true);
  for (var country in countries){
    countries[country] = spv.filter(countries[country], 'name')
  }
  console.log(dizi = countries)
})
*/
define(function(){
"use strict";

var lastfm_toptags = ["80s", "90s", "acoustic", "alternative", "alternative rock", "ambient", "black metal", "blues", "british", "chillout",
 "classical", "classic rock", "country", "dance", "death metal", "electronic", "electronica", "emo", "experimental", "favorites", "female vocalists",
 "folk", "hardcore", "hard rock", "heavy metal", "hip-hop", "hip hop", "indie", "indie rock", "industrial", "instrumental", "japanese", "jazz", "metal",
 "metalcore", "pop", "progressive metal", "progressive rock", "punk", "punk rock", "rap", "reggae", "rock", "seen live", "singer-songwriter", "soul",
 "soundtrack", "thrash metal", "trance", "trip-hop", 'instrumental hip-hop'];


var lastfm_countries = {"Australia":["Melbourne","Adelaide","Sydney"],"Austria":["Linz","Graz","Vienna","Salzburg","Innsbruck"],"Belarus":["Minsk"],"Belgium":["Liège","Brussels","Antwerp","Charleroi","Ghent"],"Brazil":["Belém","Curitiba","Brasília","Belo Horizonte","Salvador","Fortaleza","Rio de Janeiro","Recife","Manaus","Porto Alegre","São Paulo"],"Canada":["Toronto","Quebec","Montreal","Ottawa","Halifax","Vancouver","Edmonton","Saskatoon","Calgary","Winnipeg"],"Chile":["Santiago","Valparaíso"],"China":["Changsha","Chongqing","Guangzhou","Shanghai","Tianjin","Beijing"],"Colombia":["Bogotá"],"Denmark":["Copenhagen"],"Finland":["Helsinki"],"France":["Montpellier","Nancy","Grenoble","Toulouse","Rennes","Nantes","Nice","Bordeaux","Lille","Marseille","Strasbourg","Lyon","Metz","Paris","Clermont-Ferrand"],"Germany":["Rostock","Dresden","Frankfurt","Bremen","Cologne","Munich","Berlin","Stuttgart","Magdeburg","Hamburg"],"Hong Kong":["Hong Kong"],"Ireland":["Dublin","Belfast"],"Italy":["Turin","Florence","Milan","Rome","Bologna","Bari","Naples","Genoa","Palermo"],"Japan":["Niigata","Saitama","Fukuoka","Kyoto","Sapporo","Shizuoka","Nagoya","Tokyo","Hiroshima","Sendai","Kobe","Osaka"],"Mexico":["Tijuana","Mexico City","Guadalajara","Ciudad Juárez","Mexicali","Puebla","Monterrey","Villahermosa","Mérida"],"Netherlands":["Amsterdam"],"New Zealand":["Wellington","Auckland","Christchurch"],"Norway":["Bergen","Oslo"],"Poland":["Katowice","Wrocław","Cracow","Warsaw","Szczecin","Gdańsk","Poznań","Łódź"],"Portugal":["Porto","Matosinhos","Coimbra","Vila Nova de Gaia","Setúbal","Faro","Évora","Braga","Aveiro","Bragança","Lisbon"],"Russian Federation":["Moscow","Penza","Ufa","Ekaterinburg","Ryazan","Saint Petersburg"],"Spain":["Salamanca","Oviedo","Gijón","Alicante","Murcia","Barcelona","Bilbao","Madrid","Granada","Burgos","A Coruña","Seville","Zaragoza","Valencia"],"Sweden":["Uppsala","Västerås","Stockholm","Linköping","Gothenburg","Malmö","Umeå"],"Switzerland":["Winterthur","Fribourg","Geneva","Zurich","Basel","Lucerne","St. Gallen","Lausanne","Berne"],"Taiwan":["Taipei"],"Turkey":["Antalya","Adana","Istanbul","Ankara","İzmir","Bursa"],"Ukraine":["Kyiv","Odesa"],"United Kingdom":["London","Cardiff","Newport","Bristol","Birmingham","Brighton","Liverpool","Southampton","Leeds","Plymouth","Aberdeen","Exeter","Manchester","Newcastle","Glasgow","Edinburgh","Nottingham"],"United States":["Orlando","Tampa","El Paso","Milwaukee","West Palm Beach","Denver","Little Rock","Memphis","Dallas","Atlanta","San Diego","Houston","San Francisco","Sacramento","New Orleans","Pensacola","Jacksonville","San Jose","Austin","Boston","New York","Miami","Phoenix","Cleveland","Los Angeles","Pittsburgh","Washington DC","Baltimore","Nashville","Columbus","Minneapolis","Virginia Beach","Richmond","Detroit","Chicago","St Louis","Indianapolis","Louisville","Cincinnati","Syracuse","Rochester","Buffalo","Wichita","Seattle","Portland","Las Vegas","Philadelphia"]};
return {
  toptags: lastfm_toptags,
  countries: lastfm_countries
};
});
