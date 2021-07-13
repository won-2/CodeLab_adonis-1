import {HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Post from 'App/Models/Post'
import User from 'App/Models/User'
import { DateTime } from 'luxon'
import uid from 'tiny-uid'

function createSlug(subject){
    // slug 는 서버단에서자동 생서 --> request input 없음
        // publish_at 규칙 필요
        let slug = subject.trim().replace(/\s/gi, '-')
        if (slug.length > 27) slug = slug.substr(0, 28)
        slug = encodeURIComponent(slug)
        // 중복 처리 해결 코드 - 뒤에 uniq 비스무린한 짦은 코드를 붙인다.
        slug = slug += `-${uid()}`
        return slug
}

export default class PostsController {
    async list ({request}: HttpContextContract) {
        const { displayName, page, perPage } = request.qs()
        // displayName 이 없는 전체 목록 요청
        // 2. displayName 을 기준으로 필터링
        let query = Post.query()
        .preload('user')
        .where('publish_at', '<', DateTime.now().toISO())
        .orderBy('publish_at', 'desc')
        
        if( displayName ){
            const user = await User.findByOrFail('display_name', displayName)
            query = query.where('user_id', user.id)
            // const posts = await Post.query().where('displayName', displayName).paginate(1,12)
            // return posts
        }
        // else {
        //     const posts = await Post.query().paginate(1,12)
        //     return posts
        // }

        const posts = await query.paginate(page || 1, perPage || 12)
        return posts
    }

    async create({auth, request} : HttpContextContract){
        const subject = request.input('subject')
        const content = request.input('content')
        const userId = auth.user?.id
        const publishAt = request.input('publishAt', DateTime.now().toISO())
        
        const slug = createSlug(subject)

        const post = await Post.create({
            userId,
            subject,
            content,
            slug,
            publishAt
        })
        return post
    }

    async read({params} : HttpContextContract){
        // let {id} = params
        // let slug
        // if (Number.isNaN( parseInt(id, 10))){
        //     slug = id
        // }

        const {slug} = params

        const post =  await Post.query()
        .preload('user')
        .preload('comments')
        .where('publish_at', '<=', DateTime.now().toISO())
        .where('slug', slug)
        .firstOrFail()
        // if (slug) query = query.where('slug', slug)
        // else query = query.where('id', id)

        // const post = await query.first()
        // .where('id', id)
        // .first()
        // if(!post) {
        //     response.status(404)
        //     return { message : '조회할 데이터가 없습니다.'}
        // }
        return post
        
    }

    async update ({bouncer, request, params}:HttpContextContract){
        const {slug} = params
        const post = await Post.findOrFail('slug', slug)

        // await bouncer.authorize('editPost', post)
        await bouncer.with('PostPolicy').authorize('update', post)

        const subject = request.input('subject')
        const content = request.input('content')
        const publishAt = request.input('publichAt')

        if(subject){
            if (post.subject !== subject){
                post.slug = createSlug(subject)
            }
            post.subject = subject
        }
        if( content ) post.content = content
        if( publishAt) post.publishAt = publishAt
        return await post.save()
        
    }

    async delete({bouncer, params} : HttpContextContract){
        const {slug} = params
        const post = await Post.findOrFail('slug', slug)
        await bouncer.with('PostPolicy').authorize('delete', post)

        await post.delete()
    
        return 'ok'

    }

}
