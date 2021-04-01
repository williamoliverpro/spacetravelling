import Header from '../../components/Header';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client'
import { RichText } from 'prismic-dom';
import PrismicDOM from 'prismic-dom';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi'
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter()

  if (router.isFallback) {
    return <div>Carregando...</div>
  }

  let numberOfWords = post.data.content.reduce((acc, content) => {
    acc += content.heading.split(" ").length
    acc += PrismicDOM.RichText.asText(content.body).split(" ").length

    return acc
  }, 0)

  let readingTime = Math.ceil(numberOfWords / 200)

  return (
    <>
      <Header />
      <main className={styles.container}>

        <div className={styles.imageContainer}>
          <img src="/imagem.png" alt="imagem" />
        </div>

        <article className={styles.content}>
          <h1>{post.data.title}</h1>

          <div className={styles.postInfo}>
            <time><FiCalendar className={styles.icon} />{format(new Date(post.first_publication_date), "dd LLL yyyy", { locale: ptBR })}</time>
            <p><FiUser className={styles.icon} />{post.data.author}</p>
            <p><FiClock className={styles.icon} />{readingTime} min</p>
          </div>
          {post.data.content.map(content => {
            return (
              <section key={content.heading}>
                <h2>{content.heading}</h2>
                <div dangerouslySetInnerHTML={{ __html: RichText.asHtml(content.body) }} />
              </section>
            )
          })}
        </article>
      </main>
    </>
  )
}

export const getStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'publication')
  ], {
    fetch: ['publication.uid'],
    pageSize: 100
  })

  let allPosts = posts.results.map(post => {
    return {
      params: {
        slug: post.uid
      }
    }
  })

  return {
    paths: allPosts,
    fallback: true
  }
};

export const getStaticProps = async context => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('publication', String(context.params.slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url
      },
      author: response.data.author,
      content: response.data.content.map(content => ({
        heading: content.heading,
        body: content.body
      })),
    }
  }

  return {
    props: {
      post
    },
    revalidate: 60 * 30 // 30 minutes
  }
}
