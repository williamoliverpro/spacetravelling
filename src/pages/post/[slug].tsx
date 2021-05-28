/* eslint-disable no-param-reassign */
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import PrismicDOM from 'prismic-dom';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Link from 'next/link';
import { getPrismicClient } from '../../services/prismic';
import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { UtterancesComments } from '../../components/UtterancesComments/Index';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
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

type previousPublicationItem = {
  uid: string;
  title: string;
};

type laterPublicationItem = {
  uid: string;
  title: string;
};
interface PostProps {
  post: Post;
  preview: boolean;
  previousPublication: previousPublicationItem;
  laterPublication: laterPublicationItem;
}

export default function Post({
  post,
  preview,
  previousPublication,
  laterPublication,
}: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const numberOfWords = post.data.content.reduce((acc, content) => {
    acc += content.heading.split(' ').length;
    acc += PrismicDOM.RichText.asText(content.body).split(' ').length;

    return acc;
  }, 0);

  const readingTime = Math.ceil(numberOfWords / 200);

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
            <div>
              <time>
                <FiCalendar className={styles.icon} />
                {format(new Date(post.first_publication_date), 'dd LLL yyyy', {
                  locale: ptBR,
                })}
              </time>
              <p>
                <FiUser className={styles.icon} />
                {post.data.author}
              </p>
              <p>
                <FiClock className={styles.icon} />
                {readingTime} min
              </p>
            </div>

            {post.last_publication_date !== post.first_publication_date && (
              <div>
                {format(
                  new Date(post.last_publication_date),
                  "'* editado em' dd LLL yyyy', às' p",
                  {
                    locale: ptBR,
                  }
                )}
              </div>
            )}
          </div>

          {post.data.content.map(content => {
            return (
              <section key={content.heading} className={styles.postContent}>
                <h2>{content.heading}</h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </section>
            );
          })}
        </article>
      </main>

      <footer className={styles.footer}>
        <div>
          {(previousPublication && (
            <Link href={`/post/${previousPublication.uid}`}>
              <a>
                <p>{previousPublication.data.title}</p>
                <p>Post anterior</p>
              </a>
            </Link>
          )) || <p />}
          {(laterPublication && (
            <Link href={`/post/${laterPublication.uid}`}>
              <a>
                <p>{laterPublication.data.title}</p>
                <p>Próximo post</p>
              </a>
            </Link>
          )) || <p />}
        </div>
      </footer>

      <UtterancesComments />

      {preview && (
        <aside className={styles.containerPreview}>
          <Link href="/api/exit-preview">
            <a>Sair do modo Preview</a>
          </Link>
        </aside>
      )}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.Predicates.at('document.type', 'publication')],
    {
      fetch: ['publication.uid'],
      pageSize: 100,
    }
  );

  const allPosts = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths: allPosts,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  previewData,
  preview = false,
}) => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('publication', String(params.slug), {
    ref: previewData?.ref ?? null,
  });

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date ?? null,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => ({
        heading: content.heading,
        body: content.body,
      })),
    },
  };

  const previousPublications = await prismic.query(
    [Prismic.Predicates.at('document.type', 'publication')],
    {
      pageSize: 1,
      after: `${response.id}`,
      orderings: '[document.first_publication_date]',
    }
  );

  const laterPublications = await prismic.query(
    [Prismic.Predicates.at('document.type', 'publication')],
    {
      pageSize: 1,
      after: `${response.id}`,
      orderings: '[document.first_publication_date desc]',
    }
  );

  return {
    props: {
      post,
      preview,
      previousPublication: previousPublications?.results[0] ?? null,
      laterPublication: laterPublications.results[0] ?? null,
    },
    revalidate: 60 * 30, // 30 minutes
  };
};
