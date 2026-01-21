const PrivacyPolicy = () => {
  return (
    <section className="py-16 text-(--text-default)">
      <div className="mx-auto max-w-200 px-4">
        <h2 className="mb-8 text-center text-[2.5rem] font-bold">Privacy Policy for Jejak Masjid</h2>
        <p><em className="mb-8 block text-center text-[0.9rem]">Last updated: January 14, 2026</em></p>

        <h3 className="mb-4 mt-8 text-[1.8rem]">1. Introduction</h3>
        <p className="mb-4 leading-[1.6]">
          Welcome to Jejak Masjid. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website (collectively, the "Service"). Please read this policy carefully. If you do not agree with the terms of this privacy policy, please do not access the Service.
        </p>

        <h3 className="mb-4 mt-8 text-[1.8rem]">2. Information We Collect</h3>
        <h4 className="mb-4 text-[1.2rem] font-semibold">Personal Data</h4>
        <p className="mb-4 leading-[1.6]">
          We collect personally identifiable information ("Personal Data") that you voluntarily provide to us when registering at the Service, expressing an interest in obtaining information about us or our products and services, when participating in activities on the Service, or otherwise contacting us.
        </p>
        <p className="mb-4 leading-[1.6]">
          The Personal Data we collect depends on the context of your interactions with us and the Service, the choices you make, and the products and features you use. The Personal Data we may collect includes:
        </p>
        <ul className="mb-4 list-disc pl-5">
          <li className="mb-2 leading-[1.6]">Email address (for waitlist, beta testing, and account creation).</li>
          <li className="mb-2 leading-[1.6]">Basic profile information if you choose to sign up via third-party providers (e.g., Google, Apple), such as your name and profile picture. We only collect information that is explicitly granted to us by you and the third-party provider.</li>
        </ul>

        <h4 className="mb-4 text-[1.2rem] font-semibold">Usage Data</h4>
        <p className="mb-4 leading-[1.6]">
          When you access the Service, we may automatically collect certain information, including your IP address, browser type, operating system, access times, and the pages you have viewed directly before and after accessing the Service.
        </p>
        <p className="mb-4 leading-[1.6]">
          We do not collect sensitive personal information such as race, ethnicity, religious beliefs, health data, or financial information.
        </p>

        <h3 className="mb-4 mt-8 text-[1.8rem]">3. How We Use Your Information</h3>
        <p className="mb-4 leading-[1.6]">We use the information we collect or receive:</p>
        <ul className="mb-4 list-disc pl-5">
          <li className="mb-2 leading-[1.6]">To facilitate account creation and logon process via OAuth providers.</li>
          <li className="mb-2 leading-[1.6]">To send you marketing and promotional communications (if you opt-in).</li>
          <li className="mb-2 leading-[1.6]">To respond to your inquiries and offer support.</li>
          <li className="mb-2 leading-[1.6]">To request feedback and contact you about your use of our Service.</li>
          <li className="mb-2 leading-[1.6]">To provide, operate, and maintain our Service.</li>
          <li className="mb-2 leading-[1.6]">To improve, personalize, and expand our Service.</li>
          <li className="mb-2 leading-[1.6]">To understand and analyze how you use our Service.</li>
        </ul>

        <h3 className="mb-4 mt-8 text-[1.8rem]">4. Disclosure of Your Information</h3>
        <p className="mb-4 leading-[1.6]">
          We do not sell, trade, rent, or otherwise transfer your Personal Data to outside parties without your consent, except as described in this Privacy Policy.
        </p>
        <ul className="mb-4 list-disc pl-5">
          <li className="mb-2 leading-[1.6]">
            <strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.
          </li>
          <li className="mb-2 leading-[1.6]">
            <strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including data analysis, email delivery, hosting services, customer service, and marketing assistance. We do not use third-party analytics that track your activities across websites.
          </li>
        </ul>
        <p className="mb-4 leading-[1.6]">
          For Google OAuth verification purposes, we explicitly state that:
          <ul className="mb-4 list-disc pl-5">
            <li className="mb-2 leading-[1.6]">We only access your email address and basic profile information (name, profile picture) to facilitate your account creation and login experience.</li>
            <li className="mb-2 leading-[1.6]">We do not transfer this data to any other third parties.</li>
            <li className="mb-2 leading-[1.6]">We do not use this data for personalized advertising.</li>
            <li className="mb-2 leading-[1.6]">We do not sell user data.</li>
            <li className="mb-2 leading-[1.6]">We only use the data to provide the core functionality of Jejak Masjid, which is to help you track and remember your mosque visits.</li>
          </ul>
        </p>

        <h3 className="mb-4 mt-8 text-[1.8rem]">5. Data Security</h3>
        <p className="mb-4 leading-[1.6]">
          We use administrative, technical, and physical security measures to help protect your Personal Data. While we have taken reasonable steps to secure the Personal Data you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
        </p>

        <h3 className="mb-4 mt-8 text-[1.8rem]">6. Your Rights</h3>
        <p className="mb-4 leading-[1.6]">
          You have the right to access, update, or delete the Personal Data we hold about you. You can do this by contacting us directly.
        </p>

        <h3 className="mb-4 mt-8 text-[1.8rem]">7. Changes to This Privacy Policy</h3>
        <p className="mb-4 leading-[1.6]">
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
        </p>

        <h3 className="mb-4 mt-8 text-[1.8rem]">8. Contact Us</h3>
        <p className="mb-4 leading-[1.6]">
          If you have any questions or suggestions about our Privacy Policy, please contact us at <a href="mailto:admin@lonasoft.com.my">admin@lonasoft.com.my</a>
        </p>
      </div>
    </section>
  );
};

export default PrivacyPolicy;
