import { Segmented } from "antd";
import { useTranslation } from "react-i18next";
import viFlag from "../../assets/viFlag.png";
import enFlag from "../../assets/enFlag.png";
import styles from "./LanguageSwitcher.module.less";
interface LanguageSwitcherProps {
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className,
}) => {
  const { i18n } = useTranslation();

  return (
    <div className={styles.container}>
      <Segmented
        value={i18n.language}
        onChange={(lng) => i18n.changeLanguage(lng as string)}
        options={[
          {
            value: "vi",
            label: (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <img src={viFlag} width={16} alt="vi" />
                <span className={styles.labelLang}>VI</span>
              </span>
            ),
          },
          {
            value: "en",
            label: (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <img src={enFlag} width={16} alt="en" />
                <span className={styles.labelLang}>EN</span>
              </span>
            ),
          },
        ]}
      />
    </div>
  );
};
