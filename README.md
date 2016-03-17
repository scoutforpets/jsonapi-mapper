# OhMyJSONAPI [![Error Tracking](https://d26gfdfi90p7cf.cloudfront.net/rollbar-badge.144534.o.png)](https://rollbar.com)

[![Join the chat at https://gitter.im/scoutforpets/oh-my-jsonapi](https://badges.gitter.im/scoutforpets/oh-my-jsonapi.svg)](https://gitter.im/scoutforpets/oh-my-jsonapi?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
OhMyJSONAPI is a wrapper around @Seyz's excellent JSON API 1.0-compliant serializer, [jsonapi-serializer](https://github.com/SeyZ/jsonapi-serializer), that removes the pain of generating the necessary serializer options for each of your models.

## how does it work?
A serializer requires some sort of 'template' to understand how to convert what you're passing in to whatever you want to come out. When you're dealing with an ORM, such as [Bookshelf](https://github.com/tgriesser/bookshelf), it would be a real pain to have to generate the 'template' for every one of your Bookshelf models in order to convert them to JSON API. OhMyJSONAPI handles this by dynamically analyzing your models and generating the necessary 'template' to pass to the serializer.

## what ORMs do you support?
Initially, only [Bookshelf](https://github.com/tgriesser/bookshelf). However, the library can be easily extended with new adapters to support other ORMs. PR's are welcome!

## how do I install it?
`npm install oh-my-jsonapi --save`

## how do I use it?
It's pretty simple:

```javascript
// create a new instance
var jsonApi = new OhMyJSONAPI('bookshelf', 'https://api.hotapp.com');

// use that instance to output JSON API-compliant JSON using your data
return jsonApi.toJSONAPI(myData, 'appointment');
```

## api
```javascript
OhMyJSONAPI(adapter, baseUrl, serializerOptions)
```
- _(optional)_ `adapter` _(string)_: the adapter to use for transforming your data([see supported ORMs](#what-orms-do-you-support?)). Passing `null` will provide access to the raw serializer. For more information on the raw serializer, please [see the documentation here](https://github.com/SeyZ/jsonapi-serializer#documentation).
- _(optional)_ `baseUrl` _(string)_: the base URL to be used in all `links` objects returned.
- _(optional)_ `serializerOptions` _(object)_: options to be passed the serializer. [See available options here](https://github.com/SeyZ/jsonapi-serializer#documentation).

```javascript
OhMyJSONAPI#toJSONAPI(data, type, options)
```
- `data` _(object)_: the data to be serialized. Note that this expected to be data from your ORM. For example, when using the `bookshelf` adapter, it would expect this to be an instance of `Bookshelf.Model` or `Bookshelf.Collection`. If you passed `null` to the constructor, you can pass raw JSON since you would then be accessing the raw serializer.
- `type` _(string)_: the type of the resource being returned. For example, if you passed in an `Appointment` model, your `type` might be `appointment`.
- _(optional)_ `options` _(object)_:
  - _(optional)_ `includeRelations` _(boolean)_: override the default setting for including relations. By default, the serializer will include all relationship data in the response. If you'd like to lazy-load your relationships on a case-by-case basis, you can use this flag to override the default.
  - _(optional)_ `query` _(object)_: an object containing the original query parameters. these will be appended to `self` and pagination links.
  - _(optional)_ `pagination` _(object)_: pagination-related parameters for building pagination links for collections.
    - _(required)_ `offset` _(integer)_
    - _(required)_ `limit` _(integer)_
    - _(optional)_ `total` _(integer)_

# credits
- Thanks to @Seyz. Without his work, the project would not be possible.
