import { useTranslation } from 'react-i18next';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Separator } from '@/Components/ui/separator';
import { GitBranch, Handshake, Users } from 'lucide-react';

function About() {
  const { t } = useTranslation();

  return (
    <>
      {/* Banner Section */}
      <section
        className="relative flex items-center justify-center min-h-[25vh] text-white overflow-hidden"
        style={{
          backgroundImage: 'url("/public/nabatiye.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center p-4">
          <h1 className="text-4xl font-bold mb-2">{t('about.banner.aboutUs')}</h1>
          <p className="text-base">{t('about.banner.quote')}</p>
        </div>
      </section>

      {/* About Us Content Section */}
      <section className="flex flex-col md:flex-row items-center px-10 py-12 gap-8">
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold mb-3">{t('about.content.title')}</h2>
          <p className="text-muted-foreground mb-3">{t('about.content.missionStatement')}</p>
          <p className="text-muted-foreground mb-4">{t('about.content.visionStatement')}</p>
          <Button asChild>
            <a href="/auth/register">{t('about.content.volunteerButton')}</a>
          </Button>
        </div>
        <img
          src="/logo.png"
          alt="Nasna Volunteers"
          className="flex-1 max-w-full h-auto"
        />
      </section>

      {/* How We Operate Section */}
      <section className="px-5 py-16">
        <h2 className="text-2xl font-bold text-[#12a89d] mb-8">{t('about.howWeOperate.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <GitBranch className="h-12 w-12 text-[#12a89d] mb-3" />
              <h3 className="text-lg font-semibold">{t('about.howWeOperate.registrationTitle')}</h3>
              <Separator className="my-3" />
              <p className="text-muted-foreground">{t('about.howWeOperate.registrationDescription')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <Handshake className="h-12 w-12 text-[#12a89d] mb-3" />
              <h3 className="text-lg font-semibold">{t('about.howWeOperate.partnershipsTitle')}</h3>
              <Separator className="my-3" />
              <p className="text-muted-foreground">{t('about.howWeOperate.partnershipsDescription')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <Users className="h-12 w-12 text-[#12a89d] mb-3" />
              <h3 className="text-lg font-semibold">{t('about.howWeOperate.supportTitle')}</h3>
              <Separator className="my-3" />
              <p className="text-muted-foreground">{t('about.howWeOperate.supportDescription')}</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}

export default About;
