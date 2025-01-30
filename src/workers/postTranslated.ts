import { TypedWorker } from './worker';
import { Post } from '../entity';
import { logger } from '../logger';
import { remoteConfig } from '../remoteConfig';

export const postTranslated: TypedWorker<'kvasir.v1.post-translated'> = {
  subscription: 'api.post-translated',
  handler: async (message, con) => {
    const { id, translations, language } = message.data;

    const validLanguages = Object.keys(remoteConfig.validLanguages || {});
    if (!validLanguages.includes(language)) {
      logger.error({ id, language }, '[postTranslated]: Invalid language');
      return;
    }

    try {
      await con
        .getRepository(Post)
        .createQueryBuilder()
        .update(Post)
        .set({
          translation: () => `jsonb_set(
          translation,
          :language,
          :translations::jsonb,
          true
        )`,
        })
        .setParameters({
          language: [language],
          translations: JSON.stringify(translations),
        })
        .where('id = :id', { id })
        .execute();

      logger.debug(
        { id, language, keys: Object.keys(translations) },
        '[postTranslated]: Post translation updated',
      );
    } catch (error) {
      logger.error(
        { id, error },
        '[postTranslated]: Failed to update post translation',
      );
    }
  },
};
