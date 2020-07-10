const KoaRouter = require('koa-router');
const pkg = require('../../package.json');
const axios = require('axios');

const router = new KoaRouter();
const url = 'https://integracion-rick-morty-api.herokuapp.com/graphql';
const query_episodes = (number)=>{
  return `
  query{
    episodes(page: ${number}) {
        info {
          count
          pages
        }
        results {
          name
          id
          episode
          air_date
        }
      }
    }`
}
const query_characters = (number)=>{
  return `
  query{
    characters(page: ${number}) {
        info {
          count
          pages
        }
        results {
          name
          id
        }
      }
    }`
}
const query_locations = (number)=>{
  return `
  query{
    locations(page: ${number}) {
        info {
          count
          pages
        }
        results {
          name
          id
        }
      }
    }`
}
const query_episode = (number)=>{
  return `
  query{
    episode(id: ${number}) {
      id
      name
      air_date
      episode
      characters{
        id
        name
      }
      created
      }
    }`
}

const query_character = (number)=>{
  return `
  query{
    character(id: ${number}) {
      id
      name
      status
      species
      type
      gender
      origin{
        id
        name
      }
      location{
        id
        name
      }
      episode{
        id
        name
      }
      image
      created
    }
  }`
}
const query_location = (number)=>{
  return `
  query{
    location(id: ${number}) {
      id
      name
      type
      residents{
        id
        name
      }
      dimension
      created
    }
  }`
}
async function get_all_episodes() {
  const response = await axios.post(url, {
    query: query_episodes(1)
  })
  const response2 = await axios.post(url, {
    query: query_episodes(2)
  })
  const results = response.data.data.episodes.results.concat(response2.data.data.episodes.results)
  return results
}


router.get('/', async (ctx) => {
  const results = await get_all_episodes()
  await ctx.render('index', { data: results,
    profileEpisodePath: episode => ctx.router.url('episode.profile', { id: episode.id })});
});

router.get('episode.profile', 'episode/:id', async (ctx) => {
  const response = await axios.post(url, {
    query: query_episode(ctx.params.id)
  })
  await ctx.render('episode',{data: response.data.data.episode,
    characters:response.data.data.episode.characters });
});


router.get('character.profile', 'character/:id', async (ctx) => {
  const response = await axios.post(url, {
    query: query_character(ctx.params.id)
  })
  const dic = {data: response.data.data.character, episodes: response.data.data.character.episode,
    origin: response.data.data.character.origin, location: response.data.data.character.location}
  await ctx.render('character',dic)
});

router.get('location.profile', 'place/:id', async (ctx) => {
  const response = await axios.post(url, {
    query: query_location(ctx.params.id)
  })

  await ctx.render('place',{data: response.data.data.location, 
    characters:response.data.data.location.residents})
  
});


router.get('searchresults', 'search', async (ctx) => {
  var requests = [];

  for (let index = 0; index < 2; index++) {
    const request = axios.post(url, {
      query: query_episodes(index+1)
    })
    requests.push(request);
  }
  for (let index = 0; index < 25; index++) {
    const request= axios.post(url, {
      query: query_characters(index+1)
    })
    requests.push(request);
  }
  for (let index = 0; index < 4; index++) {
    const request = axios.post(url, {
      query: query_locations(index+1)
    })
    requests.push(request);
  }
  var episodes_data_f=[];
  var character_data_f=[];
  var location_data_f=[];
  var counter= 0;
  const promesas = await axios.all(requests).then(
    axios.spread((...responses) => {
      var episodes_data=[];
      var character_data=[];
      var location_data=[];
      
      for (let index = 0; index < 2; index++) {
        episodes_data=episodes_data.concat(responses[index].data.data.episodes.results)    
      }
      for (let index = 2; index < 27; index++) {
        character_data=character_data.concat(responses[index].data.data.characters.results) 
      }
      for (let index = 27; index < 31; index++) {
        location_data=location_data.concat(responses[index].data.data.locations.results) 
      }
      episodes_data.forEach(element=> {
        if (element.name.toUpperCase().indexOf(ctx.query.name.toUpperCase())>-1){
          episodes_data_f.push([element.name,element.id]);
          counter++;
        }
      })
      character_data.forEach(element=> {
        if (element.name.toUpperCase().indexOf(ctx.query.name.toUpperCase())>-1){
          character_data_f.push([element.name,element.id]);
          counter++;
        }
      })
      location_data.forEach(element=> {
        if (element.name.toUpperCase().indexOf(ctx.query.name.toUpperCase())>-1){
          location_data_f.push([element.name,element.id]);
          counter++;
        }
      })
      const dic = {episodes:episodes_data_f,characters:character_data_f,
        locations:location_data_f,counter: counter}
      return dic
    })
  );
  await ctx.render('search',promesas) 


});





module.exports = router;
