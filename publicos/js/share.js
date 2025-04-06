const Share = {
    networks: {
      facebook: 'https://www.facebook.com/sharer/sharer.php?u=',
      twitter: 'https://twitter.com/intent/tweet?url=',
      whatsapp: 'whatsapp://send?text=',
      telegram: 'https://t.me/share/url?url='
    },
  
    open(network, url = window.location.href, text = '') {
      if (navigator.share) {
        navigator.share({ title: text, url });
      } else {
        const shareUrl = this.networks[network] + 
          encodeURIComponent(url) + 
          (text ? `&text=${encodeURIComponent(text)}` : '');
        window.open(shareUrl, '_blank', 'width=600,height=400');
      }
    }
  };