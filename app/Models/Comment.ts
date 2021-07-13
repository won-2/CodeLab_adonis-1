import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm'
import User from './User'
import Post from './Post'

export default class Comment extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public userId : number

  @column()
  public postId : number

  @column()
  public parentId : number

  @column()
  public content : string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(()=> User)
  public user: BelongsTo<typeof User>
  
  @belongsTo(()=> Post)
  public post: BelongsTo<typeof Post>
  
  // @belongsTo(()=> Comment,{
  //   foreignKey:'parantId',
  //   localKey:'id'
  // })
  // public parent: BelongsTo<typeof Comment>
  

  @hasMany( ()=> Comment, {
    foreignKey:'parentId',
    localKey:'id'
  })
  public comments: HasMany<typeof Comment>
  
}
