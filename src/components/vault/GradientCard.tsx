import styled from "styled-components";

// Vault component: "Gradient Card" (components/cards)
type Props = {
  title?: string;
  description?: string;
  iconPath?: string;
  gradient?: string;
};

const DEFAULT_ICON =
  "M20 5H4V19L13.2923 9.70649C13.6828 9.31595 14.3159 9.31591 14.7065 9.70641L20 15.0104V5ZM2 3.9934C2 3.44476 2.45531 3 2.9918 3H21.0082C21.556 3 22 3.44495 22 3.9934V20.0066C22 20.5552 21.5447 21 21.0082 21H2.9918C2.44405 21 2 20.5551 2 20.0066V3.9934ZM8 11C6.89543 11 6 10.1046 6 9C6 7.89543 6.89543 7 8 7C9.10457 7 10 7.89543 10 9C10 10.1046 9.10457 11 8 11Z";

const Card = ({
  title = "Card Title",
  description = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  iconPath = DEFAULT_ICON,
  gradient = "linear-gradient(-45deg, #f89b29 0%, #ff0f7b 100%)",
}: Props) => {
  return (
    <StyledWrapper style={{ ["--card-grad" as string]: gradient }}>
      <div className="card">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d={iconPath} />
        </svg>
        <div className="card__content">
          <p className="card__title">{title}</p>
          <p className="card__description">{description}</p>
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .card {
    position: relative;
    width: 300px;
    height: 200px;
    background: var(--card-grad);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .card svg {
    width: 48px;
    fill: #fff;
    transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .card:hover {
    transform: rotate(-5deg) scale(1.1);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }

  .card__content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    width: 100%;
    height: 100%;
    padding: 20px;
    box-sizing: border-box;
    background-color: #11111b;
    opacity: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .card:hover .card__content {
    transform: translate(-50%, -50%) rotate(0deg);
    opacity: 1;
  }

  .card__title {
    margin: 0;
    font-size: 22px;
    color: #fff;
    font-weight: 700;
  }

  .card__description {
    margin: 10px 0 0;
    font-size: 14px;
    color: #b9b9c9;
    line-height: 1.4;
  }

  .card:hover svg {
    scale: 0;
    transform: rotate(-45deg);
  }
`;

export default Card;
